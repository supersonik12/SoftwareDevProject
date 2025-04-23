console.log("yo");
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
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        $(modal).modal("hide");
      });
    }
  });
}
initializeModals();

let selectedPageBtn;
let selectedFilterValues;
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

document.addEventListener("DOMContentLoaded", () => {
  const filterBtns = document.querySelectorAll(".filter-form li button");
  const filterForm = document.querySelector(".filter-form");

  if (filterForm) {
    filterBtns.forEach((btn) => {
      btn.classList.add("close-filter-btn");
      btn.addEventListener("click", () => {
        if (btn.classList.contains("close-filter-btn")) {
          btn.classList.remove("close-filter-btn");
          btn.classList.add("open-filter-btn");
        } else {
          btn.classList.remove("open-filter-btn");
          btn.classList.add("close-filter-btn");
        }
      });
    });
    const homeContainer = document.querySelector(".home-page-container");
    const getPetForms = homeContainer.querySelectorAll('form[method="GET"]');
    console.log(getPetForms);
    getPetForms.forEach((form) => {
      form.addEventListener("submit", () => {
        console.log("hello");
        $(document.querySelector(".loading-modal")).modal("show");
      });
    });
  }
});

function selectPageBtn(btn) {
  selectedPageBtn = btn;
  btn.classList.add("selected-page");
}
