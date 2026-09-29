(() => {
  const services = window.RPAServices || [];
  const grids = document.querySelectorAll('[data-services-grid]');
  if (!grids.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'service-dialog';
  dialog.setAttribute('aria-labelledby', 'service-title');
  dialog.innerHTML = `<div class="service-dialog-head"><h2 id="service-title"></h2><button class="service-close" type="button" aria-label="Fechar detalhes do serviço" autofocus>&times;</button></div><div class="service-dialog-body"><img class="service-dialog-image" alt=""><div class="service-description"></div><a class="service-quote" target="_blank" rel="noopener noreferrer">Solicitar orçamento pelo WhatsApp</a></div>`;
  document.body.append(dialog);
  const title = dialog.querySelector('h2');
  const image = dialog.querySelector('img');
  const description = dialog.querySelector('.service-description');
  const quote = dialog.querySelector('.service-quote');
  let opener;
  function openService(service, button) {
    opener = button;
    title.textContent = service.title;
    image.src = service.image;
    image.alt = service.title;
    description.replaceChildren();
    service.sections.forEach(section => {
      if (section.heading) {
        const heading = document.createElement('h3');
        heading.textContent = section.heading;
        description.append(heading);
      }
      if (section.text) {
        const paragraph = document.createElement('p');
        paragraph.textContent = section.text;
        description.append(paragraph);
      }
      if (section.items) {
        const list = document.createElement('ul');
        section.items.forEach(text => {
          const item = document.createElement('li');
          item.textContent = text;
          list.append(item);
        });
        description.append(list);
      }
    });
    const contact = window.RPAApi?.getContacts()?.phoneLink;
    const phone = new URL(contact || 'https://wa.me/5516991058868', location.origin);
    phone.searchParams.set('text', `Olá! Gostaria de um orçamento para: ${service.title}.`);
    quote.href = phone.href;
    dialog.showModal();
    dialog.querySelector('.service-dialog-body').scrollTop = 0;
    document.body.classList.add('service-modal-open');
  }
  dialog.querySelector('.service-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('service-modal-open');
    opener?.focus();
  });
  grids.forEach(grid => {
    grid.replaceChildren();
    services.forEach(service => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'service-card';
      button.setAttribute('aria-haspopup', 'dialog');
      const photo = document.createElement('img');
      photo.src = service.image;
      photo.alt = '';
      photo.loading = 'lazy';
      photo.width = 600;
      photo.height = 450;
      const label = document.createElement('span');
      label.className = 'service-card-title';
      label.textContent = service.title;
      button.append(photo, label);
      button.addEventListener('click', () => openService(service, button));
      grid.append(button);
    });
  });
})();
