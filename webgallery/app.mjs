import { rmSync } from "fs";
import fs from "fs";
import { createServer } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import Datastore from "nedb";
import session from "express-session";
import { parse, serialize } from "cookie";
import { genSalt, hash, compare } from "bcrypt";


const PORT = 3000;
const app = express();

app.use(express.json());
app.use(express.static("static"));
app.use('/uploads', express.static('uploads'));

const users = new Datastore({ filename: "db/users.db", autoload: true});
const images = new Datastore ({ filename: "db/images.db", autoload: true});

const upload = multer({ dest: "uploads/" });

app.use(
  session({
    secret: "i like pineapple on pizza",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req, res, next) {
  var cookies = parse(req.headers.cookie || "");
  req.username = cookies.username ? cookies.username : null;
  console.log("HTTP request", req.username, req.method, req.url, req.body);
  next();
});

app.use(function (req, res, next) {
    console.log("HTTP request", req.method, req.url, req.body);
    next();
});

const isAuthenticated = function (req, res, next) {
  var cookies = parse(req.headers.cookie || "");
  if (!req.session.username && !cookies.username) return res.status(401).end("access denied");
  next();
};

////////////////////// SIGN UP
app.post("/signup/", function (req, res, next) {
    if (!("username" in req.body))
      return res.status(400).end("username is missing");
    if (!("password" in req.body))
      return res.status(400).end("password is missing");

    var username = req.body.username;
    var password = req.body.password;

    users.findOne({ _id: username }, function (err, user) {
      if (err) return res.status(500).end(err);
      if (user)
        return res.status(409).end("username already exists");

      genSalt(10, function (err, salt) {
        hash(password, salt, function (err, hash) {
          users.update(
            { _id: username },
            { _id: username, hash: hash, images: [] },
            { upsert: true },
            function (err) {
              if (err) return res.status(500).end(err);
              return res.json(username);
            }
          );
        });
      });
    });
  });


//////////////// SIGN IN
app.post("/signin/", function (req, res, next) {
    // extract data from HTTP request
    if (!("username" in req.body))
      return res.status(400).end("username is missing");
    if (!("password" in req.body))
      return res.status(400).end("password is missing");

    var username = req.body.username;
    var password = req.body.password;

    users.findOne({ _id: username }, function (err, user) {
      if (err) return res.status(500).end(err);
      if (!user) return res.status(401).end("user does not exist");
      compare(password, user.hash, function (err, valid) {
        if (err) return res.status(500).end(err);
        if (!valid) return res.status(401).end("incorrect password");

        req.session.username = username;
        res.setHeader(
          "Set-Cookie",
          serialize("username", user._id, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          })
        );

        return res.json(username);
      });
    });
});

// SIGN OUT
app.get("/signout/", isAuthenticated, function (req, res, next) {
    req.session.destroy();
    res.setHeader(
      "Set-Cookie",
      serialize("username", "", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
      })
    );
    return res.redirect("/");
});

/////////////// GET USERS
app.get("/api/users/", function(req, res, next) {
  users.find({})
  .exec(function (err, usersAll) {
    if (err) return res.status(500).end(err);

    users.count({}, function (err, count) {
      if (err) return res.status(500).end(err);
      return res.json(usersAll.slice(0, count));
    });
  });
});

///// ADD IMAGES
app.post("/api/images/", isAuthenticated, upload.single("image-file"), function (req, res) {
  const imageTitle = req.body["image-title"];
  const authorName = req.body["author-name"];
  const filename = req.file.originalname; 
  const filepath = req.file.path;

  users.findOne({ _id: req.username }, function (err, user) {
    if (err) return res.status(500).end("error retrieving user data");

    if (!user) return res.status(404).end("user not found");

    let imageNumber = 1;
    if (user && user.images) {
      imageNumber = user.images.length + 1;
    }

    const imageFilename = `${req.username}_${imageNumber}${path.extname(filename)}`;
    const imageLocation = `uploads/${imageFilename}`;

    fs.rename(filepath, imageLocation, function (err) {
      if (err) return res.status(500).end("error moving image");

      const imageData = {
        title: imageTitle,
        author: authorName,
        imageLocation: imageLocation,
      };

      images.insert(imageData, function (err, newImage) {
        if (err) return res.status(500).end("error adding image");

        imageData["id"] = newImage._id;
        users.update(
          { _id: user._id},
          { $push: { images: imageData } }, 
          function (err, numUpdated) {
            if (err) return res.status(500).end("error updating user images");
            res.json({
              username: req.username,
              imageData: imageData
            });
          }
        );

        users.persistence.compactDatafile();
      });
    });
  });
});

// DELETE IMAGE
app.delete("/api/images/:id/", isAuthenticated, function (req, res, next) {
  images.findOne({ _id: req.params.id }, function (err, image) {
    if (err) return res.status(500).end(err);

    if (!image) return res.status(404).end("image does not exist");

    var forbid = true;
    users.findOne({ _id: req.username }, function (err, user) {
      if (err) return res.status(500).end(err);
      if (!user) return res.status(404).end("user not found");

      user.images.forEach(function(i) {
        if (i["id"] == image._id){
          users.update(
            { _id: user._id },
            { $pull: { images: i } },
            function (err) {
              if (err) return res.status(500).end("error deleting user images");

              
              users.persistence.compactDatafile();
    
              images.remove({ _id: image._id }, {}, function (err) {
                if (err) return res.status(500).end("error deleting image");

                
              images.persistence.compactDatafile();
    
                res.json({
                  message: "image deleted successfully"
                });
              });
            }  
          );
        }
      });
    });
  });
});

// ADD COMMENTS
app.post("/api/comments/", isAuthenticated, function (req, res, next) {
  const comment = {
  	  content: req.body.comment,
      image: req.body.id
  };
  comments.insert(comment, function (err, comment) {
    if (err) return res.status(500).end(err);
    return res.json(comment);
  });
});

export const server = createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}