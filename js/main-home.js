document.addEventListener('DOMContentLoaded', () => {

    const forms = document.querySelectorAll('.contact-form');

    if (!forms.length) {
        return;
    }

    const LEAD_ENDPOINT = 'send-lead.php';

    forms.forEach((form) => {

        form.addEventListener('submit', async (event) => {

            event.preventDefault();

            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton
                ? submitButton.textContent
                : '';

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Отправляем...';
            }

            try {

                const formData = new FormData(form);

                const payload = {
                    name: formData.get('name') || '',
                    phone: formData.get('phone') || '',
                    service: formData.get('service') || '',
                    message: formData.get('message') || '',
                    consent: formData.get('consent') === 'on',
                    website: formData.get('website') || '',
                    utm: formData.get('utm') || '',
                    page: window.location.href
                };

                const response = await fetch(LEAD_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json().catch(() => null);

                if (!response.ok || !result || result.ok !== true) {

                    let errorMessage = 'Неизвестная ошибка';

                    if (result) {

                        if (result.error) {
                            errorMessage = result.error;
                        }

                        if (result.details) {
                            errorMessage += '\n\n' + result.details;
                        }
                    } else {
                        errorMessage = 'HTTP ' + response.status;
                    }

                    throw new Error(errorMessage);
                }

                alert('Спасибо! Ваша заявка успешно отправлена.');

                form.reset();

            } catch (error) {

                console.error('Ошибка отправки заявки:', error);

                /*
                 * ВРЕМЕННО показываем настоящую ошибку Telegram/PHP.
                 * После диагностики вернём обычное сообщение.
                 */

                alert(
                    'Заявка НЕ отправлена.\n\n' +
                    'Причина:\n' +
                    error.message
                );

            } finally {

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    });
});