// ===============================
// TOPIAR — MAIN JAVASCRIPT
// ===============================


// Мобильное меню

const mobileMenu = document.querySelector('.mobile-menu');
const nav = document.querySelector('.nav');

mobileMenu.addEventListener('click', () => {

    nav.classList.toggle('mobile-open');

});


// Форма заявки

const contactForm = document.querySelector('.contact-form');

contactForm.addEventListener('submit', (event) => {

    event.preventDefault();

    alert('Спасибо! Мы свяжемся с вами.');

});