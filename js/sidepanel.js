function autoResize(textarea) {
  textarea.style.height = "auto";

  if (textarea.scrollHeight > 300) textarea.style.height = "300px";
  else textarea.style.height = textarea.scrollHeight + "px";
}

document.getElementById("prompt_input").addEventListener("input", function () {
  autoResize(this);
});
