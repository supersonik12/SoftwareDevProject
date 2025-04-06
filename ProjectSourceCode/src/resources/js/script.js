Handlebars.registerHelper("ifEquals", function (a, b, options) {
  if (a == b) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

fetch("/views/partials/info_modal.hbs")
  .then((response) => response.text())
  .then((html) => {
    Handlebars.registerPartial("info_modal", html);
  });

fetch("/views/partials/contact_modal.hbs")
  .then((response) => response.text())
  .then((html) => {
    Handlebars.registerPartial("contact_modal", html);
  });

let template;
fetch("/views/partials/petPage.hbs")
  .then((response) => response.text())
  .then((html) => {
    template = html;
  });

function initializeModals() {
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
}
initializeModals();

let selectedPageBtn;
document.addEventListener("DOMContentLoaded", () => {
  const pageNav = document.querySelector(".page-nav");
  if (pageNav) {
    data = pageNav.getAttribute("data");

    const pageButtons = document.querySelectorAll(".page-button");
    selectPageBtn(pageButtons[0]);

    pageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedPageBtn.classList.remove("selected-page");
        selectPageBtn(button);
        let newData = {
          ...JSON.parse(data),
          selectedPage: parseInt(button.textContent),
        };
        let renderPage = Handlebars.compile(template);
        document.getElementById("pet-page").innerHTML = renderPage(newData);
        initializeModals();
      });
    });
  }
});

function selectPageBtn(btn) {
  selectedPageBtn = btn;
  btn.classList.add("selected-page");
}
