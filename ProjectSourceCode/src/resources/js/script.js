const pets = document.querySelectorAll(".pet");
pets.forEach((pet) => {
  const infoBtn = pet.querySelector(".infoBtn");
  const infoModal = pet.querySelector(`.infoModal`);
  infoBtn.addEventListener("click", () => {
    $(infoModal).modal("show");
  });
  const contactBtn = pet.querySelector(".contactBtn");
  const contactModal = pet.querySelector(".contactModal");
  contactBtn.addEventListener("click", () => {
    $(contactModal).modal("show");
  });
});

const modals = document.querySelectorAll(".modal");
modals.forEach((modal) => {
  const closeButton = modal.querySelector(".closeModal");
  closeButton.addEventListener("click", () => {
    $(modal).modal("hide");
  });
});
