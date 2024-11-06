import * as api from "./api.mjs";

function onError(err) {
  console.error("[error]", err);

  const error_div = document.querySelector("#error");
  error_div.innerHTML = err.message;
  error_div.style.display = "block";
}

function submit() {
  if (document.querySelector("form").checkValidity()) {
    const username = document.querySelector("form [name=username]").value;
    const password = document.querySelector("form [name=password]").value;
    const action = document.querySelector("form [name=action]").value;
    api[action](username, password, onError, function (username) {
      window.location.href = "/";
    });
  }
}

document.querySelector("#signup").addEventListener("click", function (e) {
  document.querySelector("form [name=action]").value = "signup";
  submit();
});

document.querySelector("#signin").addEventListener("click", function (e) {
  document.querySelector("form [name=action]").value = "signin";
  submit();
});

document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault();
});
