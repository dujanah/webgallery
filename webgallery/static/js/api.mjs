export function getUsername() {
    return document.cookie.replace(
      /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );
}
  
function handleReponse(res){
    if (res.status != 200) { return res.text().then(text => { throw new Error(`${text} (status: ${res.status})`)}); }
    return res.json();
}

export function getUsers(fail, success) {
    fetch("/api/users/")
    .then(handleReponse)
    .then(success)
    .catch(fail);
}

export function signin(username, password, fail, success) {
    fetch("/signin/", {
  		method:  "POST",
  		headers: {"Content-Type": "application/json"},
  		body: JSON.stringify({ username, password }),
    })
	.then(handleReponse)
	.then(success)
	.catch(fail);
}

export function signup(username, password, fail, success) {
    fetch("/signup/", {
  		method:  "POST",
  		headers: {"Content-Type": "application/json"},
  		body: JSON.stringify({ username, password }),
    })
	.then(handleReponse)
	.then(success)
    .catch(fail);
}

export function addImage(imageFile, imageTitle, authorName, fail, success) {
    const imageData = new FormData();
    imageData.append("image-file", imageFile);
    imageData.append("image-title", imageTitle);
    imageData.append("author-name", authorName); //

    fetch("/api/images/", {
  		method:  "POST",
  		body: imageData
    })
	.then(handleReponse)
	.then(success)
	.catch(fail);
}

export function deleteImage(imageId, fail, success) {
    fetch(`/api/images/${imageId}/`, {
		method:  "DELETE",
	})
	.then(handleReponse)
	.then(success)
	.catch(fail);
}

export function addComment(imageId, comment, fail, success) {
    fetch("/api/comments/", {
        method:  "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ imageId, comment }),
  })
  .then(handleReponse)
  .then(success)
  .catch(fail);
}