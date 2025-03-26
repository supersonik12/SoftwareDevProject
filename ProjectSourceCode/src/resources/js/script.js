ts = document.querySelectorAll(".pet");
pets.forEach((pet) => {
  const infoBtn = pet.querySelector(".infoBtn");
  const modal = pet.querySelector(`.infoModal`);
  infoBtn.addEventListener("click", () => {
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
