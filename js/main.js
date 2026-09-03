// ===============================
// TOPIAR — MAIN JAVASCRIPT
// ===============================


// ===============================
// МОБИЛЬНОЕ МЕНЮ
// ===============================

const mobileMenu = document.querySelector('.mobile-menu');
const nav = document.querySelector('.nav');

if (mobileMenu && nav) {

    mobileMenu.addEventListener('click', () => {
        nav.classList.toggle('mobile-open');
    });

}


// ===============================
// ФОРМА ЗАЯВКИ
// ===============================

const contactForm = document.querySelector('.contact-form');

if (contactForm) {

    contactForm.addEventListener('submit', (event) => {

        event.preventDefault();

        alert('Спасибо! Мы свяжемся с вами.');

    });

}


// ===============================
// ФИЛЬТР ПРОЕКТОВ
// ===============================

const filterButtons = document.querySelectorAll('.project-filter');
const projects = document.querySelectorAll('.gallery-project');

if (filterButtons.length && projects.length) {

    filterButtons.forEach(button => {

        button.addEventListener('click', () => {

            const filter = button.dataset.filter;


            // Убираем active со всех кнопок

            filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });


            // Добавляем active выбранной кнопке

            button.classList.add('active');


            // Фильтруем проекты

            projects.forEach(project => {

                const category = project.dataset.category;

                if (filter === 'all' || category === filter) {

                    project.style.display = '';

                } else {

                    project.style.display = 'none';

                }

            });

        });

    });

}