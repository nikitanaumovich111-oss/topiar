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
// ФОРМА ЗАЯВКИ — ОТПРАВКА В TELEGRAM
// ===============================

const TELEGRAM_BOT_TOKEN = '8757387500:AAG-XsWOtTvcBiEU5914Q5Q37QmQIpjO_q4';
const TELEGRAM_CHAT_ID = '931492862';

const SERVICE_LABELS = {
    topiary: 'Топиарные конструкции',
    light: 'Световые фигуры',
    newyear: 'Новогоднее оформление',
    individual: 'Индивидуальный проект'
};

async function sendLeadToTelegram(text) {

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text
        })
    });

    if (!response.ok) {
        throw new Error('Telegram API error: ' + response.status);
    }

    return response.json();

}

const contactForms = document.querySelectorAll('.contact-form, .contacts-form');

contactForms.forEach(contactForm => {

    contactForm.addEventListener('submit', async (event) => {

        event.preventDefault();

        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonHTML = submitButton ? submitButton.innerHTML : '';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Отправляем...';
        }

        const formData = new FormData(contactForm);

        const name = (formData.get('name') || '').toString().trim();
        const phone = (formData.get('phone') || '').toString().trim();
        const serviceValue = (formData.get('service') || '').toString().trim();
        const message = (formData.get('message') || '').toString().trim();

        const lines = [
            '🔔 Новая заявка с сайта TOPIAR',
            '',
            `Имя: ${name || '—'}`,
            `Телефон: ${phone || '—'}`
        ];

        if (serviceValue) {
            lines.push(`Услуга: ${SERVICE_LABELS[serviceValue] || serviceValue}`);
        }

        if (message) {
            lines.push(`Сообщение: ${message}`);
        }

        lines.push(`Страница: ${window.location.pathname}`);

        try {

            await sendLeadToTelegram(lines.join('\n'));

            alert('Спасибо! Мы свяжемся с вами.');
            contactForm.reset();

        } catch (error) {

            alert('Не получилось отправить заявку. Пожалуйста, позвоните нам напрямую: +375 29 697 20 80');

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
            }

        }

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
// Ключ — теги через запятую в алфавитном порядке: figures, fringe, neon
const constructorPhotos = {
    '': 'base.jpg',
    'figures': 'figures.jpg',
    'fringe': 'fringe.jpg',
    'neon': 'neon.jpg',
    'figures,fringe': 'fringe-figures.jpg',
    'figures,neon': 'figures-neon.jpg',
    'fringe,neon': 'fringe-neon.jpg',
    'figures,fringe,neon': 'all.jpg'
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
        constructorNote.textContent = '';
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