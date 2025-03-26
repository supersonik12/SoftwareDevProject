const infoBtns = document.querySelectorAll(".infoBtn");
infoBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    $("#infoModal").modal("show");
  });
});
