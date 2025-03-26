const infoBtns = document.querySelectorAll(".infoBtn");
infoBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modals = document.querySelectorAll(".infoModal");
    const modal = document.querySelector(
      `.infoModal[index = '${btn.getAttribute("index")}']`
    );
    console.log(modals);
    $(modal).modal("show");
  });
});
