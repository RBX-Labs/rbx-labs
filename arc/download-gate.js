(() => {
  const dialog = document.querySelector('#download-dialog');
  const form = document.querySelector('#download-form');
  const recipient = 'avery@rbx-labs.io';
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

    const details = [...new FormData(form).entries()]
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n');
    const subject = encodeURIComponent('Runtime Trust Kit download');
    const body = encodeURIComponent(`${details}\n\nRequested from https://rbx-labs.io/arc/`);

    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
    const emailLink = document.createElement('a');
    emailLink.href = mailtoUrl;
    emailLink.target = '_blank';
    emailLink.rel = 'noopener noreferrer';
    emailLink.hidden = true;
    document.body.appendChild(emailLink);
    emailLink.click();
    emailLink.remove();

    const download = document.createElement('a');
    download.href = downloadUrl;
    download.download = 'runtime-trust-kit.pdf';
    document.body.appendChild(download);
    download.click();
    download.remove();
    closeDialog();
  });
})();
