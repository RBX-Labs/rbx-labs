(() => {
  const dialog = document.querySelector('#download-dialog');
  const form = document.querySelector('#download-form');
  const endpoint = 'https://betweenus-moments.isekainormie.chatgpt.site/api/arc-download';
  const downloadUrl = 'runtime-trust-kit.pdf';

  if (!dialog || !form) return;

  const closeDialog = () => {
    dialog.close();
    document.body.classList.remove('dialog-open');
  };

  document.querySelectorAll('[data-download-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      dialog.showModal();
      document.body.classList.add('dialog-open');
      form.querySelector('input')?.focus();
    });
  });

  dialog.querySelector('[data-dialog-close]')?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('cancel', () => document.body.classList.remove('dialog-open'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.elements['First name'].value,
        lastName: form.elements['Last name'].value,
        organisation: form.elements.Organisation.value,
        email: form.elements['Email address'].value
      })
    }).then((response) => {
      if (!response.ok) throw new Error('Unable to submit the request.');
      const download = document.createElement('a');
      download.href = downloadUrl;
      download.download = 'runtime-trust-kit.pdf';
      document.body.appendChild(download);
      download.click();
      download.remove();
      closeDialog();
    }).catch(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Download the full kit (PDF)';
      window.alert('We could not process the request. Please try again.');
    });
  });
})();
