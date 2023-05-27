const toggle = document.getElementById("toggleDark");
const body = document.querySelector("body");
const input = document.querySelector("input");
const chatSection = document.querySelector("#chatSection");
toggle.addEventListener("click", function () {
  this.classList.toggle("bi-moon");
  if (this.classList.toggle("bi-brightness-high-fill")) {
    body.style.background = "white";
    input.style.backgroundColor = "white";
    body.style.color = "black";
    body.style.transition = "2s";
  } else {
    body.style.background = "rgb(13, 26, 46)";
    input.style.backgroundColor = "black";
    chatSection.style.border = "4px solid white";
    body.style.color = "white";
    body.style.transition = "2s";
  }
});
