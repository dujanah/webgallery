import {
    getUsername,
    addImage,
    getUsers,
    deleteImage
} from "./api.mjs";

function onError(err) {
  console.error("[error]", err);

  const error_div = document.querySelector("#error");
  error_div.innerHTML = err.message;
  error_div.style.display = "block";
}

const username = getUsername();

// Toggle on/off to show or hide image upload form
const toggleBtn = document.getElementById("toggle-image-form-btn");
const imageUploadForm = document.getElementById("add-image-form");

toggleBtn.addEventListener("click", function (e) {
    if (window.getComputedStyle(imageUploadForm).display === "flex") {
        imageUploadForm.style.display = "none";
    } else {
        imageUploadForm.style.display = "flex";
    }
});

// create galleries for users that have images in their gallery
function updateGalleries() {
  document.querySelector("#image-galleries").innerHTML = "";

  getUsers(onError, function(users) {
    console.log("printed");
    users.forEach(function (user) {
      const gallery = document.createElement("div");
      gallery.id = "gallery" + user._id;
      gallery.className = "image-gallery";

      gallery.innerHTML = `<h2>${user._id}'s Gallery</h2>` + 
            `<div class="display-image"></div>
            <div class="image-info">
                <h3 class="image-title">Image Title</h3>
                <p class="image-author">Author</p>
            </div>
            <div class="image-controls">
                <i class="arrow left previous-picture"></i>
                <img class="delete delete-image" id="delete_${user._id}" alt="delete" src="media/delete.png">
                <i class="arrow right next-picture"></i>
            </div>
            <form class="comment-form">
                <input
                    type="text"
                    id="post-comment-1"
                    class="comment-input"
                    placeholder="Share your thoughts..."
                    name="comment-1"
                    required
                >
              <button type="submit" class="share btn">Share</button>
            </form>
            <div class="comments">
                <div class="div-comment">
                    <div class="user-info">
                        <p class="username">dujanahz</p>
                        <p class="date">2016/07/08</p>
                    </div>
                    <p class="comment"> What a great day!</p>
                    <img class="delete" src="media/delete.png">
                </div>
            </div>
      `;

      if (user.images.length){
        // decide which image
        var indexOfImage = 0;

        // set image
        var imageLocation = `url("/${user.images[indexOfImage]["imageLocation"]}")`;
        gallery.querySelector(".display-image").style.backgroundImage = imageLocation;
        gallery.querySelector(".image-title").innerHTML = user.images[indexOfImage]["title"];
        gallery.querySelector(".image-author").innerHTML = user.images[indexOfImage]["author"];

        gallery.querySelector(".previous-picture").addEventListener("click", function(){
          indexOfImage = Math.max(0, indexOfImage - 1);
          console.log(indexOfImage);

          // set image
          imageLocation = `url("/${user.images[indexOfImage]["imageLocation"]}")`;
          gallery.querySelector(".display-image").style.backgroundImage = imageLocation;
          gallery.querySelector(".image-title").innerHTML = user.images[indexOfImage]["title"];
          gallery.querySelector(".image-author").innerHTML = user.images[indexOfImage]["author"];
        });  

        gallery.querySelector(".next-picture").addEventListener("click", function(){
          indexOfImage = Math.min(user.images.length - 1, indexOfImage + 1);
          console.log(indexOfImage);

          // set image
          imageLocation = `url("/${user.images[indexOfImage]["imageLocation"]}")`;
          gallery.querySelector(".display-image").style.backgroundImage = imageLocation;
          gallery.querySelector(".image-title").innerHTML = user.images[indexOfImage]["title"];
          gallery.querySelector(".image-author").innerHTML = user.images[indexOfImage]["author"];
        });  

        gallery.querySelector(".delete-image").addEventListener("click", function() {
          deleteImage(user.images[indexOfImage]["id"], onError, function() {
            user.images.splice(indexOfImage, 1);

            if (user.images.length){
              indexOfImage = Math.max(0, indexOfImage - 1);
              imageLocation = `url("/${user.images[indexOfImage]["imageLocation"]}")`;
              gallery.querySelector(".display-image").style.backgroundImage = imageLocation;
              gallery.querySelector(".image-title").innerHTML = user.images[indexOfImage]["title"];
              gallery.querySelector(".image-author").innerHTML = user.images[indexOfImage]["author"];
            } else {
              gallery.style.display = "none";
            }

          });
        });

        gallery.querySelector(

        document.querySelector("#image-galleries").prepend(gallery));
      }
    });
  });
}
updateGalleries();


// hide sign in or sign out button
document.querySelector("#login-link").style.display = username
  ? "none"
  : "block";
document.querySelector("#logout-link").style.display = username
  ? "block"
  : "none";

// hide form and galleries
const display = username ? "block" : "none";
document.querySelector("#image-upload-section").style.display = display;
document.querySelector("#image-galleries").style.display = display;

// authenticate and set behavior for submitting image uplaod form
if (username) {
  const form = document.querySelector("#add-image-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const file = document.querySelector("#image-file-content").files[0];
    const title = document.querySelector("#image-title-content").value;
    const author = document.querySelector("#image-author-content").value;
    form.reset();
    addImage(file, title, author, onError, updateGalleries);
  });
}
