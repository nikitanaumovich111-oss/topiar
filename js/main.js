// ===============================
// TOPIAR — MAIN JAVASCRIPT
// ===============================


// ===============================
// REVEAL — плавное появление блоков при скролле
// ===============================

(function initReveal() {

    const revealSelectors = [
        '.advantage-item',
        '.stat',
        '.product-card',
        '.project',
        '.gallery-project',
        '.review-card',
        '.partner-item',
        '.service-item',
        '.work-step',
        '.process-card',
        '.about-value',
        '.about-approach-card',
        '.constructor-option',
        '.constructor-teaser-box',
        '.contact-detail'
    ];

    const revealEls = document.querySelectorAll(revealSelectors.join(','));

    if (!revealEls.length) return;

    // Небольшая ступенчатая задержка для элементов внутри
    // одного родителя — эффект последовательного появления
    const delayCounters = new Map();

    revealEls.forEach(el => {

        el.classList.add('reveal');

        const parent = el.parentElement;
        const count = delayCounters.get(parent) || 0;

        if (count < 8) {
            el.style.transitionDelay = (count * 70) + 'ms';
        }

        delayCounters.set(parent, count + 1);

    });

    if (!('IntersectionObserver' in window)) {
        revealEls.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }

        });

    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => revealObserver.observe(el));

})();


// ===============================
// АНИМИРОВАННЫЕ СЧЁТЧИКИ
// ===============================

(function initCounters() {

    const counters = document.querySelectorAll('[data-counter]');

    if (!counters.length) return;

    function animateCounter(el) {

        const target = parseInt(el.dataset.target, 10) || 0;
        const suffix = el.dataset.suffix || '';
        const duration = 1400;
        const startTime = performance.now();

        function tick(now) {

            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);

            el.textContent = value + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = target + suffix;
            }

        }

        requestAnimationFrame(tick);

    }

    if (!('IntersectionObserver' in window)) {
        counters.forEach(animateCounter);
        return;
    }

    const counterObserver = new IntersectionObserver((entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }

        });

    }, { threshold: 0.4 });

    counters.forEach(el => counterObserver.observe(el));

})();


// ===============================
// AMBIENT LIGHT — мерцающие искры фоном
// ===============================

(function initAmbientLight() {

    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    // ---- Небольшое свечение за курсором ----

    const glow = document.createElement('div');
    glow.className = 'glow-cursor';
    document.body.prepend(glow);

    let glowX = 0, glowY = 0, glowActive = false, glowTicking = false;

    window.addEventListener('mousemove', (e) => {

        glowX = e.clientX;
        glowY = e.clientY;

        if (!glowActive) {
            glow.classList.add('is-active');
            glowActive = true;
        }

        if (!glowTicking) {
            requestAnimationFrame(() => {
                glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
                glowTicking = false;
            });
            glowTicking = true;
        }

    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        glow.classList.remove('is-active');
        glowActive = false;
    });


    // ---- Мерцающие искры (canvas, на весь экран) ----

    if (window.matchMedia('(pointer: coarse)').matches) return; // мобильные — пропускаем ради батареи

    const canvas = document.createElement('canvas');
    canvas.className = 'ambient-sparkles';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width, height, particles;
    const PARTICLE_COUNT = 26;

    function resize() {

        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    }

    function createParticles() {

        particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 0.6 + Math.random() * 1.6,
            speed: 0.08 + Math.random() * 0.18,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.01 + Math.random() * 0.02
        }));

    }

    resize();
    createParticles();

    let frame;
    let isVisible = true;

    function tick() {

        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {

            p.y -= p.speed;
            p.phase += p.twinkleSpeed;

            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }

            const twinkle = (Math.sin(p.phase) + 1) / 2;
            const alpha = 0.15 + twinkle * 0.45;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 215, 110, ${alpha.toFixed(2)})`;
            ctx.fill();

        });

        if (isVisible) {
            frame = requestAnimationFrame(tick);
        }

    }

    tick();

    document.addEventListener('visibilitychange', () => {

        isVisible = document.visibilityState === 'visible';

        if (isVisible) {
            tick();
        } else {
            cancelAnimationFrame(frame);
        }

    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resize();
            createParticles();
        }, 200);
    });

})();


// ===============================
// BLUR-UP — плавная загрузка фото
// ===============================

(function initImageFadeIn() {

    const skipIds = ['constructorImage', 'lightboxImage'];

    const imgs = document.querySelectorAll('main img, .footer img');

    imgs.forEach(img => {

        if (skipIds.includes(img.id)) return;

        img.classList.add('img-fade');

        function reveal() {
            img.classList.add('is-loaded');
        }

        if (img.complete && img.naturalWidth > 0) {
            reveal();
        } else {
            img.addEventListener('load', reveal, { once: true });
            img.addEventListener('error', reveal, { once: true });
        }

    });

})();


// ===============================
// 3D-НАКЛОН КАРТОЧЕК ПОД КУРСОР
// ===============================

(function initTilt() {

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    const tiltConfig = [
        { selector: '.project', lift: 0 },
        { selector: '.product-card', lift: -8 },
        { selector: '.gallery-project-large', lift: -7 },
        { selector: '.gallery-project-wide', lift: -7 }
    ];

    tiltConfig.forEach(({ selector, lift }) => {

        document.querySelectorAll(selector).forEach(el => {

            function onMove(e) {

                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                const rotateX = (-y * 6).toFixed(2);
                const rotateY = (x * 8).toFixed(2);

                el.style.transform =
                    `perspective(900px) translateY(${lift}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            }

            function onLeave() {
                el.style.transform = '';
            }

            el.addEventListener('mousemove', onMove);
            el.addEventListener('mouseleave', onLeave);

        });

    });

})();


// ===============================
// STICKY-ШАПКА СО СТЕКЛОМ ПРИ СКРОЛЛЕ
// ===============================

(function initStickyHeader() {

    const header = document.querySelector('.header');

    if (!header) return;

    let ticking = false;

    function updateHeader() {
        header.classList.toggle('is-scrolled', window.scrollY > 40);
        ticking = false;
    }

    window.addEventListener('scroll', () => {

        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }

    }, { passive: true });

    updateHeader();

})();


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

const LEAD_ENDPOINT = 'send-lead.php';

function setFormStatus(form, type, text) {
    let el = form.querySelector('.form-status');
    if (!el) {
        el = document.createElement('p');
        el.className = 'form-status';
        el.setAttribute('role', 'status');
        form.appendChild(el);
    }
    el.className = 'form-status form-status-' + type;
    el.textContent = text;
}

// UTM-метки сохраняем на время визита, чтобы видеть источник заявки
function getUtm() {
    try {
        const params = new URLSearchParams(window.location.search);
        const keys = ['utm_source', 'utm_medium', 'utm_campaign'];
        const found = keys.filter(k => params.get(k)).map(k => k + '=' + params.get(k));
        if (found.length) sessionStorage.setItem('topiar_utm', found.join('&'));
        return sessionStorage.getItem('topiar_utm') || '';
    } catch (e) {
        return '';
    }
}

async function sendLead(payload) {

    const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error('Lead endpoint error: ' + response.status);
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
        const consent = formData.get('consent') === 'on';

        try {

            await sendLead({
                name,
                phone,
                service: serviceValue,
                message,
                consent,
                website: (formData.get('website') || '').toString(),
                utm: getUtm(),
                page: window.location.pathname
            });

            setFormStatus(contactForm, 'ok', 'Спасибо! Заявка отправлена, мы свяжемся с вами.');
            contactForm.reset();

        } catch (error) {

            setFormStatus(contactForm, 'error', 'Не получилось отправить заявку. Позвоните нам: +375 29 697 20 80');

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

    // Кнопка «Обсудить такой проект» передаёт выбор в форму заявки
    const constructorCta = document.querySelector('.constructor-cta');
    if (constructorCta) {
        constructorCta.setAttribute('href', 'contacts.html' + (checked.length ? '?constructor=' + checked.join(',') : ''));
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
// МИНИ-ГАЛЕРЕЯ ПРОЕКТА (витрина на главной)
// ===============================

// Описания и фото для карточек из витрины на главной странице.
// Добавляйте свои файлы в массив images — первым можно поставить
// то же фото, что уже используется в карточке.
const projectShowcaseData = {

    '01': {
        label: 'ГОРОДСКАЯ ИЛЛЮМИНАЦИЯ',
        title: 'Праздничная арка «Беларусь»',
        description: 'Праздничная арка с гирляндами и гербом Республики Беларусь над центральным проспектом — доминанта новогоднего оформления города, хорошо видна с любой точки улицы и днём, и ночью.',
        meta: ['ГОРОД', '2026'],
        images: [
            'assets/images/light-23.jpg'
        ]
    },

    '02': {
        label: 'СВЕТОВАЯ ИНСТАЛЛЯЦИЯ',
        title: 'Ангельские крылья',
        description: 'Световая фотозона в виде крыльев — один из самых узнаваемых арт-объектов. Контурная подсветка хорошо читается и днём, и ночью, а конструкция рассчитана на активный поток посетителей.',
        meta: ['СВЕТОВЫЕ ФИГУРЫ', '2026'],
        images: [
            'assets/images/angel-wings.jpg',
            'assets/images/light-05.jpg',
            'assets/images/light-13.jpg'
        ]
    },

    '03': {
        label: 'ОФОРМЛЕНИЕ АТРИУМА',
        title: 'Подвесные конструкции + свет',
        description: 'Подвесная световая инсталляция для атриума бизнес-центра: сочетание объёмных фигур и точечной подсветки создаёт праздничную атмосферу внутри помещения.',
        meta: ['БИЗНЕС', '2026'],
        images: [
            'assets/images/project-03-atrium.jpg',
            'assets/images/light-06.jpg',
            'assets/images/light-09.jpg'
        ]
    }

};

const projectModal = document.getElementById('projectModal');

if (projectModal) {

    const projectModalImage = document.getElementById('projectModalImage');
    const projectModalCounter = document.getElementById('projectModalCounter');
    const projectModalLabel = document.getElementById('projectModalLabel');
    const projectModalTitle = document.getElementById('projectModalTitle');
    const projectModalDescription = document.getElementById('projectModalDescription');
    const projectModalMeta = document.getElementById('projectModalMeta');
    const projectModalClose = document.getElementById('projectModalClose');
    const projectModalOverlay = document.getElementById('projectModalOverlay');
    const projectModalPrev = document.getElementById('projectModalPrev');
    const projectModalNext = document.getElementById('projectModalNext');

    const projectTriggers = document.querySelectorAll('[data-project-modal]');

    let currentProject = null;
    let currentPhotoIndex = 0;

    function renderProjectPhoto() {

        if (!currentProject) return;

        const photos = currentProject.images;

        projectModalImage.classList.remove('is-loaded');
        projectModalImage.src = photos[currentPhotoIndex];
        projectModalImage.alt = currentProject.title;

        if (projectModalCounter) {
            projectModalCounter.textContent = photos.length > 1
                ? `${currentPhotoIndex + 1} / ${photos.length}`
                : '';
        }

        const showNav = photos.length > 1;

        if (projectModalPrev) projectModalPrev.style.display = showNav ? '' : 'none';
        if (projectModalNext) projectModalNext.style.display = showNav ? '' : 'none';

    }

    function openProjectModal(id) {

        const data = projectShowcaseData[id];

        if (!data) return;

        currentProject = data;
        currentPhotoIndex = 0;

        if (projectModalLabel) projectModalLabel.textContent = data.label || '';
        if (projectModalTitle) projectModalTitle.textContent = data.title || '';
        if (projectModalDescription) projectModalDescription.textContent = data.description || '';

        if (projectModalMeta) {
            projectModalMeta.innerHTML = '';
            (data.meta || []).forEach(item => {
                const span = document.createElement('span');
                span.textContent = item;
                projectModalMeta.appendChild(span);
            });
        }

        renderProjectPhoto();

        projectModal.classList.add('is-open');
        document.body.style.overflow = 'hidden';

    }

    function closeProjectModal() {

        projectModal.classList.remove('is-open');
        document.body.style.overflow = '';

    }

    function showNextPhoto() {
        if (!currentProject) return;
        currentPhotoIndex = (currentPhotoIndex + 1) % currentProject.images.length;
        renderProjectPhoto();
    }

    function showPrevPhoto() {
        if (!currentProject) return;
        currentPhotoIndex = (currentPhotoIndex - 1 + currentProject.images.length) % currentProject.images.length;
        renderProjectPhoto();
    }

    projectTriggers.forEach(trigger => {

        trigger.addEventListener('click', (event) => {

            // Разрешаем открыть ссылку в новой вкладке как обычно
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;

            event.preventDefault();
            openProjectModal(trigger.dataset.projectModal);

        });

    });

    if (projectModalImage) {
        projectModalImage.addEventListener('load', () => {
            projectModalImage.classList.add('is-loaded');
        });
    }

    if (projectModalClose) {
        projectModalClose.addEventListener('click', closeProjectModal);
    }

    if (projectModalOverlay) {
        projectModalOverlay.addEventListener('click', closeProjectModal);
    }

    if (projectModalNext) {
        projectModalNext.addEventListener('click', showNextPhoto);
    }

    if (projectModalPrev) {
        projectModalPrev.addEventListener('click', showPrevPhoto);
    }

    document.addEventListener('keydown', (event) => {

        if (!projectModal.classList.contains('is-open')) return;

        if (event.key === 'Escape') closeProjectModal();
        if (event.key === 'ArrowRight') showNextPhoto();
        if (event.key === 'ArrowLeft') showPrevPhoto();

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


// ===============================
// ФОРМА: защита от ботов и подстановка выбора из конструктора
// ===============================

(function initFormExtras() {

    const forms = document.querySelectorAll('.contact-form, .contacts-form');
    if (!forms.length) return;

    forms.forEach(form => {
        const trap = document.createElement('input');
        trap.type = 'text';
        trap.name = 'website';
        trap.tabIndex = -1;
        trap.autocomplete = 'off';
        trap.setAttribute('aria-hidden', 'true');
        trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
        form.appendChild(trap);
    });

    const labels = {
        neon: 'Гибкий неон по фасаду',
        fringe: 'Светодиодная бахрома',
        figures: 'Новогодние фигуры'
    };

    const chosen = new URLSearchParams(window.location.search).get('constructor');
    if (!chosen) return;

    const names = chosen.split(',').map(k => labels[k]).filter(Boolean);
    if (!names.length) return;

    const form = forms[0];
    const message = form.querySelector('textarea[name="message"]');
    const service = form.querySelector('select[name="service"]');

    if (message && !message.value) {
        message.value = 'Интересует оформление из конструктора: ' + names.join(', ') + '.';
    }
    if (service && !service.value && service.querySelector('option[value="newyear"]')) {
        service.value = 'newyear';
    }

})();


// ===============================
// ПЛАВАЮЩИЕ КНОПКИ СВЯЗИ (мобильные)
// ===============================

(function initContactBar() {

    if (document.body.classList.contains('notfound-page')) return;

    const bar = document.createElement('div');
    bar.className = 'contact-bar';
    bar.innerHTML =
        '<a href="tel:+375296972080" class="contact-bar-call">Позвонить</a>' +
        '<a href="https://t.me/Svidunkash" target="_blank" rel="noopener">Telegram</a>' +
        '<a href="contacts.html" class="contact-bar-lead">Заявка</a>';
    document.body.appendChild(bar);

})();


// ===============================
// МЕНЮ: состояние для скринридеров
// ===============================

(function initMenuAria() {

    const btn = document.querySelector('.mobile-menu');
    const menu = document.querySelector('.nav');
    if (!btn || !menu) return;

    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
        btn.setAttribute('aria-expanded', menu.classList.contains('mobile-open') ? 'true' : 'false');
    });

})();
