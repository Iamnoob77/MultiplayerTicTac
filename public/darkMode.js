const toggle = document.getElementById("toggleDark");
const body = document.querySelector("body");
const input = document.querySelector("input");
toggle.addEventListener("click", function () {
  this.classList.toggle("bi-moon");
  if (this.classList.toggle("bi-brightness-high-fill")) {
    body.style.background = "white";
    input.style.backgroundColor = "white";
    body.style.color = "black";
    body.style.transition = "2s";
  } else {
    body.style.background = "black";
    input.style.backgroundColor = "black";
    body.style.color = "white";
    body.style.transition = "2s";
  }
});
