//refactor this

const infoBtns = document.querySelectorAll(".infoBtn");
infoBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.querySelector(
      `.infoModal[index = '${btn.getAttribute("index")}']`
    );

    $(modal).modal("show");
  });
});

const modals = document.querySelectorAll(".infoModal");
modals.forEach((modal) => {
  const closeButton = modal.querySelector(".closeInfo");
  closeButton.addEventListener("click", () => {
    $(modal).modal("hide");
  });
});
