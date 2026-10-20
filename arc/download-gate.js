(() => {
  const dialog = document.querySelector('#download-dialog');
  const form = document.querySelector('#download-form');
  const status = document.querySelector('#download-form-status');
  const endpoint = 'https://betweenus-moments.isekainormie.chatgpt.site/api/arc-download';
  const downloadUrl = 'ai-reliability-commons-arc.pdf';
  let lastTrigger = null;

  if (!dialog || !form) return;

  const closeDialog = () => {
    if (dialog.open) dialog.close();
    document.body.classList.remove('dialog-open');
    document.querySelectorAll('[data-download-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    lastTrigger?.focus();
  };

  document.querySelectorAll('[data-download-trigger]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      lastTrigger = trigger;
      dialog.showModal();
      document.body.classList.add('dialog-open');
      trigger.setAttribute('aria-expanded', 'true');
      status.hidden = true;
      form.querySelector('input')?.focus();
    });
  });

  dialog.querySelector('[data-dialog-close]')?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('cancel', closeDialog);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    status.hidden = true;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.elements.firstName.value,
        lastName: form.elements.lastName.value,
        organisation: form.elements.organisation.value,
        email: form.elements.email.value
      })
    }).then((response) => {
      if (!response.ok) throw new Error('Unable to submit the request.');
      const download = document.createElement('a');
      download.href = downloadUrl;
      download.download = 'ai-reliability-commons-arc.pdf';
      document.body.appendChild(download);
      download.click();
      download.remove();
      closeDialog();
    }).catch(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Download the full kit (PDF)';
      status.textContent = 'We could not process the request. Please try again.';
      status.classList.add('error');
      status.hidden = false;
      status.setAttribute('role', 'alert');
    });
  });
})();
