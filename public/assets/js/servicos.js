(() => {
  const grids = [...document.querySelectorAll('[data-services-grid]')];
  if (!grids.length) return;
  const canEdit = () => window.RPAAuth?.canManageUsers() === true;
  let services = [], revision = 0, loaded = false, current = null, opener = null, editing = false, busy = false, draftMedia = [];
  const element = (tag, className, text) => {
    const node = document.createElement(tag); if (className) node.className = className;
    if (text !== undefined) node.textContent = text; return node;
  };
  const button = (label, action, className = '') => {
    const node = element('button', className, label); node.type = 'button'; node.addEventListener('click', action); return node;
  };
  const status = element('p', 'services-status', 'Carregando serviços…'); status.setAttribute('role', 'status');
  grids[0].before(status);
  const toolbar = element('div', 'services-admin-toolbar'); toolbar.hidden = true;
  const createButton = button('Cadastrar serviço', () => openEditor(null)); toolbar.append(createButton); grids[0].before(toolbar);
  const dialog = element('dialog', 'service-dialog'); dialog.setAttribute('aria-labelledby', 'service-title');
  dialog.innerHTML = `<div class="service-dialog-head"><h2 id="service-title"></h2><button type="button" class="service-close" aria-label="Fechar detalhes" autofocus>&times;</button></div>
    <div class="service-dialog-body"><div class="service-detail-layout"><div class="service-gallery"><div class="service-media-stage"></div><div class="service-thumbnails" aria-label="Fotos e vídeos do serviço"></div></div><div class="service-copy"><div class="service-description"></div><a class="service-quote" target="_blank" rel="noopener noreferrer">Solicitar orçamento pelo WhatsApp</a><div class="service-admin-actions" hidden></div></div></div>
    <form class="service-editor" hidden><label>Título do serviço<input name="title" required maxlength="200"></label><h3>Informações do serviço</h3><p>Separe o conteúdo em blocos com subtítulo, descrição e listas.</p><div class="service-sections-editor"></div><button type="button" class="service-add-section">Adicionar bloco de informações</button><h3>Fotos e vídeos</h3><p>A primeira mídia será a capa. Imagens JPG, PNG e WebP até 5 MB; vídeos MP4 e WebM até 15 MB. Até 12 mídias, com no máximo 15 MB de novos arquivos por salvamento.</p><div class="service-media-editor"></div><label>Adicionar fotos ou vídeos<input class="service-files" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple></label><div class="service-editor-actions"><button type="submit" class="service-save">Salvar serviço</button><button type="button" class="service-cancel">Cancelar</button></div></form>
    <p class="service-message" role="status" aria-live="polite"></p></div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const form = $('.service-editor'), detail = $('.service-detail-layout'), message = $('.service-message');
  function pauseVideos() { dialog.querySelectorAll('video').forEach(video => video.pause()); }
  function cleanupDraft() { draftMedia.forEach(media => { if(media.file) URL.revokeObjectURL(media.url); }); draftMedia = []; }
  function showDialog() { if(!dialog.open) dialog.showModal(); document.body.classList.add('service-modal-open'); $('.service-dialog-body').scrollTop = 0; }
  function requestClose() { if(busy) return; if(editing && !confirm('Descartar as alterações não salvas?')) return; dialog.close(); }
  $('.service-close').addEventListener('click', requestClose);
  dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
  dialog.addEventListener('click', event => {
    if(event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) requestClose();
  });
  dialog.addEventListener('close', () => { pauseVideos(); cleanupDraft(); editing = false; document.body.classList.remove('service-modal-open'); if(opener?.isConnected) opener.focus(); else createButton.focus(); });
  function showMedia(media, title) {
    const node = element(media.type === 'video' ? 'video' : 'img', 'service-dialog-image');
    node.src = media.url;
    if(media.type === 'video') { node.controls = true; node.preload = 'metadata'; node.playsInline = true; node.setAttribute('aria-label', title); }
    else node.alt = title;
    return node;
  }
  function showService(service, source) {
    pauseVideos(); cleanupDraft(); current = service; if(source) opener = source; editing = false;
    form.hidden = true; detail.hidden = false; message.textContent = '';
    $('#service-title').textContent = service.title;
    const stage = $('.service-media-stage'), thumbnails = $('.service-thumbnails'); stage.replaceChildren(); thumbnails.replaceChildren();
    const selectMedia = (media, index) => {
      stage.querySelectorAll('video').forEach(video => video.pause()); stage.replaceChildren(showMedia(media, service.title));
      [...thumbnails.children].forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
    };
    service.media.forEach((media, index) => {
      const thumb = button(`${media.type === 'video' ? 'Vídeo' : 'Foto'} ${index + 1}`, () => selectMedia(media, index));
      if(media.type === 'image') { const img = element('img'); img.src = media.url; img.alt = ''; img.loading = 'lazy'; thumb.prepend(img); }
      thumbnails.append(thumb);
    });
    if(service.media.length) selectMedia(service.media[0], 0); else stage.append(element('p', 'service-no-media', 'Sem mídia cadastrada'));
    const description = $('.service-description'); description.replaceChildren();
    service.sections.forEach(section => {
      if(section.heading) description.append(element('h3', '', section.heading));
      if(section.text) section.text.split(/\n\s*\n/).filter(Boolean).forEach(text => description.append(element('p', '', text)));
      if(section.items?.length) { const list = element('ul'); section.items.forEach(text => list.append(element('li', '', text))); description.append(list); }
    });
    const phone = new URL(window.RPAApi?.getContacts()?.phoneLink || 'https://wa.me/5516991058868', location.origin);
    phone.searchParams.set('text', `Olá! Gostaria de um orçamento para: ${service.title}.`); $('.service-quote').href = phone.href;
    const actions = $('.service-admin-actions'); actions.replaceChildren(); actions.hidden = !canEdit();
    actions.append(button('Editar serviço e mídias', () => openEditor(current)), button('Excluir serviço', deleteService, 'service-danger'));
    showDialog();
  }
  function renderCards() {
    grids.forEach(grid => {
      grid.replaceChildren();
      services.forEach(service => {
        const card = button('', () => showService(service, card), 'service-card'); card.setAttribute('aria-haspopup', 'dialog');
        const cover = service.media[0];
        if(cover) {
          const photo = element(cover.type === 'video' ? 'video' : 'img'); photo.src = cover.url;
          if(cover.type === 'video') { photo.muted = true; photo.preload = 'metadata'; photo.playsInline = true; photo.setAttribute('aria-hidden', 'true'); }
          else { photo.alt = ''; photo.loading = 'lazy'; } card.append(photo);
        } else card.append(element('span', 'service-no-media', 'Sem mídia cadastrada'));
        card.append(element('span', 'service-card-title', service.title)); grid.append(card);
      });
    });
    status.textContent = services.length ? '' : 'Nenhum serviço cadastrado.';
    toolbar.hidden = !canEdit() || !loaded;
  }
  function addSection(section = {}) {
    if($('.service-sections-editor').children.length >= 30) { message.textContent = 'Use até 30 blocos.'; return; }
    const block = element('fieldset', 'service-section-editor');
    block.innerHTML = `<legend>Bloco de informações</legend><label>Subtítulo<input data-field="heading" maxlength="200"></label><label>Descrição<textarea data-field="text" rows="6" maxlength="16000"></textarea></label><label>Lista (um item por linha)<textarea data-field="items" rows="3"></textarea></label>`;
    block.querySelector('[data-field="heading"]').value = section.heading || '';
    block.querySelector('[data-field="text"]').value = section.text || '';
    block.querySelector('[data-field="items"]').value = (section.items || []).join('\n');
    block.append(button('Mover para cima', () => { if(block.previousElementSibling) block.parentNode.insertBefore(block, block.previousElementSibling); }), button('Remover bloco', () => block.remove(), 'service-danger'));
    $('.service-sections-editor').append(block);
  }
  function renderDraftMedia() {
    const list = $('.service-media-editor'); list.querySelectorAll('video').forEach(video => video.pause()); list.replaceChildren();
    draftMedia.forEach((media, index) => {
      const item = element('div', 'service-media-item'); item.append(showMedia(media, `Mídia ${index + 1}`));
      item.append(element('span', '', index === 0 ? 'Capa do serviço' : `Mídia ${index + 1}`));
      item.append(button('Usar como capa', () => { pauseVideos(); draftMedia.splice(index,1); draftMedia.unshift(media); renderDraftMedia(); }));
      item.append(button('Remover', () => { pauseVideos(); if(media.file) URL.revokeObjectURL(media.url); draftMedia.splice(index,1); renderDraftMedia(); }, 'service-danger')); list.append(item);
    });
  }
  function openEditor(service) {
    if(!canEdit() || busy) return;
    pauseVideos(); cleanupDraft(); current = service; editing = true; form.reset(); detail.hidden = true; form.hidden = false; message.textContent = '';
    $('#service-title').textContent = service ? 'Editar serviço' : 'Cadastrar serviço'; form.elements.title.value = service?.title || '';
    $('.service-sections-editor').replaceChildren(); (service?.sections || [{}]).forEach(addSection);
    draftMedia = (service?.media || []).map(media => ({...media})); renderDraftMedia(); showDialog(); form.elements.title.focus();
  }
  $('.service-add-section').addEventListener('click', () => addSection());
  $('.service-files').addEventListener('change', event => {
    const files = [...event.target.files]; event.target.value = '';
    if(files.length + draftMedia.length > 12) { message.textContent = 'Use até 12 mídias por serviço.'; return; }
    const total = files.reduce((n,f)=>n+f.size,0) + draftMedia.reduce((n,m)=>n+(m.file?.size||0),0);
    if(total > 15*1024*1024) { message.textContent = 'Envie até 15 MB de novos arquivos por salvamento.'; return; }
    for(const file of files) {
      if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type) || (file.type.startsWith('image/') && file.size > 5*1024*1024)) { message.textContent = 'Use imagens JPG, PNG ou WebP até 5 MB e vídeos MP4 ou WebM.'; return; }
    }
    files.forEach(file => draftMedia.push({file, url:URL.createObjectURL(file), type:file.type.startsWith('video/')?'video':'image'})); renderDraftMedia(); message.textContent = '';
  });
  $('.service-cancel').addEventListener('click', () => { if(!busy && confirm('Descartar as alterações não salvas?')) { if(current) showService(current); else dialog.close(); } });
  function setBusy(value) { busy = value; dialog.querySelectorAll('button,input,textarea').forEach(node => node.disabled = value); }
  function acceptCatalog(result) { services = result.services; revision = result.revision; loaded = true; renderCards(); }
  form.addEventListener('submit', async event => {
    event.preventDefault(); if(busy || !canEdit()) return;
    const sections = [...$('.service-sections-editor').children].map(block => ({heading:block.querySelector('[data-field="heading"]').value.trim(),text:block.querySelector('[data-field="text"]').value.trim(),items:block.querySelector('[data-field="items"]').value.split('\n').map(t=>t.trim()).filter(Boolean)}));
    const body = new FormData(); let fileIndex = 0;
    const order = draftMedia.map(media => { if(!media.file) return media.id; body.append('media[]', media.file); return `new:${fileIndex++}`; });
    body.append('service', JSON.stringify({id:current?.id || '',revision,title:form.elements.title.value.trim(),sections,keepMedia:draftMedia.filter(m=>!m.file).map(m=>m.id),mediaOrder:order}));
    message.textContent = 'Salvando serviço…'; setBusy(true);
    try {
      const result = await RPAApi.request('/api/admin/services/save.php', body);
      const id = current?.id || result.services[result.services.length - 1].id;
      acceptCatalog(result); setBusy(false); showService(services.find(service=>service.id===id)); message.textContent = 'Serviço salvo.';
    } catch(error) { message.textContent = error.message; }
    finally { setBusy(false); }
  });
  async function deleteService() {
    if(!current || busy || !canEdit() || !confirm(`Excluir o serviço “${current.title}” e suas mídias? Esta ação não pode ser desfeita.`)) return;
    setBusy(true); message.textContent = 'Excluindo serviço…';
    try { acceptCatalog(await RPAApi.request('/api/admin/services/delete.php',{id:current.id,revision})); dialog.close(); status.textContent = 'Serviço excluído.'; }
    catch(error) { message.textContent = error.message; }
    finally { setBusy(false); }
  }
  function syncPermissions() { toolbar.hidden = !loaded || !canEdit(); $('.service-admin-actions').hidden = !canEdit(); if(editing && !canEdit() && !busy) dialog.close(); }
  document.addEventListener('rpa-auth-change', syncPermissions);
  RPAApi.request('/api/public/services.php').then(acceptCatalog).catch(error => { status.textContent = error.message; });
  window.RPAAuth?.ready.then(syncPermissions).catch(()=>{});
})();
