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

const contactForms = document.querySelectorAll('.contact-form, .contacts-form');

contactForms.forEach(contactForm => {

    contactForm.addEventListener('submit', (event) => {

        event.preventDefault();

        alert('Спасибо! Мы свяжемся с вами.');

    });

});


// ===============================
// КОНСТРУКТОР ОФОРМЛЕНИЯ
// ===============================

const constructorOptions = document.querySelectorAll('.constructor-option input[type="checkbox"]');
const constructorImage = document.getElementById('constructorImage');
const constructorCount = document.getElementById('constructorCount');
const constructorNote = document.getElementById('constructorNote');
const constructorReset = document.querySelector('.constructor-reset');

// Готовые фото-комбинации (лежат в assets/images/constructor/)
// Ключ — теги через запятую в алфавитном порядке: arch, garland, led, topiary
const constructorPhotos = {
    '': 'base.jpg',
    'topiary': 'topiary.jpg',
    'arch': 'arch.jpg',
    'garland': 'garland.jpg',
    'led': 'led.jpg',
    'arch,garland': 'arch-garland.jpg',
    'arch,led': 'arch-led.jpg',
    'led,topiary': 'led-topiary.jpg',
    'garland,topiary': 'garland-topiary.jpg',
    'arch,topiary': 'arch-topiary.jpg',
    'arch,garland,topiary': 'arch-garland-topiary.jpg',
    'arch,led,topiary': 'arch-led-topiary.jpg'
};

const constructorBasePath = 'assets/images/constructor/';

// Предзагрузка всех фото, чтобы переключение было мгновенным
Object.values(constructorPhotos).forEach(file => {
    const img = new Image();
    img.src = constructorBasePath + file;
});

function updateConstructorStage() {

    if (!constructorImage) return;

    const checked = Array.from(constructorOptions)
        .filter(input => input.checked)
        .map(input => input.dataset.tag);

    let tags = checked.slice();
    let showNote = false;

    // Фото с одновременным сочетанием "гирлянда" + "LED" пока не готовы —
    // показываем вариант без LED и предупреждаем об этом

    if (tags.includes('garland') && tags.includes('led')) {
        tags = tags.filter(tag => tag !== 'led');
        showNote = true;
    }

    tags.sort();

    const key = tags.join(',');
    const file = constructorPhotos[key] || constructorPhotos[''];

    const newSrc = constructorBasePath + file;

    if (constructorImage.getAttribute('src') !== newSrc) {
        constructorImage.classList.add('is-updating');
        constructorImage.src = newSrc;

        requestAnimationFrame(() => {
            constructorImage.classList.remove('is-updating');
        });
    }

    if (constructorCount) {
        constructorCount.textContent = checked.length;
    }

    if (constructorNote) {
        constructorNote.textContent = showNote
            ? 'Фото с гирляндой и LED-подсветкой одновременно скоро добавим — сейчас показываем вариант без LED.'
            : '';
    }

}

if (constructorOptions.length) {

    constructorOptions.forEach(input => {

        input.addEventListener('change', updateConstructorStage);

    });

    updateConstructorStage();

}

if (constructorReset) {

    constructorReset.addEventListener('click', () => {

        constructorOptions.forEach(input => {
            input.checked = false;
        });

        updateConstructorStage();

    });

}


// ===============================
// ЛАЙТБОКС — просмотр фото проектов
// ===============================

const lightbox = document.getElementById('lightbox');
const galleryPhotos = document.querySelectorAll('.gallery-photo[data-image]');

if (lightbox && galleryPhotos.length) {

    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    const photos = Array.from(galleryPhotos).map(el => ({
        src: el.dataset.image,
        title: el.dataset.title || ''
    }));

    let currentIndex = 0;

    function openLightbox(index) {

        currentIndex = (index + photos.length) % photos.length;

        const photo = photos[currentIndex];

        lightboxImage.classList.remove('is-loaded');
        lightboxImage.src = photo.src;
        lightboxImage.alt = photo.title;
        lightboxCaption.textContent = photo.title;

        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';

    }

    function closeLightbox() {

        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';

    }

    function showNext() {
        openLightbox(currentIndex + 1);
    }

    function showPrev() {
        openLightbox(currentIndex - 1);
    }

    galleryPhotos.forEach((el, index) => {

        el.addEventListener('click', () => {
            openLightbox(index);
        });

    });

    lightboxImage.addEventListener('load', () => {
        lightboxImage.classList.add('is-loaded');
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', showNext);
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', showPrev);
    }

    // Закрытие по клику на тёмный фон (но не по самому фото)
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    // Управление с клавиатуры
    document.addEventListener('keydown', (event) => {

        if (!lightbox.classList.contains('is-open')) return;

        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowRight') showNext();
        if (event.key === 'ArrowLeft') showPrev();

    });

}


// ===============================
// ФИЛЬТР ПРОЕКТОВ
// ===============================

const filterButtons = document.querySelectorAll('.project-filter');
const projects = document.querySelectorAll('.gallery-project');
const photoSections = document.querySelectorAll('.gallery-photo-section');

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


            // Фильтруем карточки проектов

            projects.forEach(project => {

                const category = project.dataset.category;

                if (filter === 'all' || category === filter) {

                    project.style.display = '';

                } else {

                    project.style.display = 'none';

                }

            });


            // Скрываем/показываем целиком секции фотогалереи
            // (заголовок + сетка), чтобы не оставался пустой
            // блок с названием другой категории

            photoSections.forEach(section => {

                const category = section.dataset.category;

                if (filter === 'all' || category === filter) {

                    section.style.display = '';

                } else {

                    section.style.display = 'none';

                }

            });

        });

    });

}