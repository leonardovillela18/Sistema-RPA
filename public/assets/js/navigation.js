// Edite aqui a logo, os links da navegação e o botão de WhatsApp de todas as páginas.
(() => {
  const links = [
    ['index.html', 'INÍCIO'], ['servicos.html', 'SERVIÇOS'],
    ['produtos.html', 'PRODUTOS'], ['sobre.html', 'SOBRE NÓS'],
    ['contato.html', 'CONTATO']
  ];
  const icons = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/>',
    tiktok: '<path d="M14 3v12.5a4.5 4.5 0 1 1-4-4.47M14 3c0 4 3 6 6 6V6c-2 0-3-1-3-3z"/>',
    whatsapp: '<path d="M20.5 11.5a9 9 0 0 1-13.3 7.9L3 21l1.4-4.4A9 9 0 1 1 20.5 11.5Z"/><path d="M8 7c-2 3 3 8 6 8l2-2-3-1-1 1-2-2 1-1-1-3z"/>'
  };
  const icon = name => `<svg class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const header = document.createElement('header');
  header.className = 'site-header';
  const page = location.pathname.split('/').pop() || 'index.html';
  header.innerHTML = `<a class="logo" href="/index.html" aria-label="RPA Mecânica Diesel — início"><img src="/assets/img/logo_barra.jpeg" alt="RPA Mecânica Diesel"></a><nav aria-label="Navegação principal"><ul>${links.map(([file, label]) => `<li><a href="/${file}"${page === file ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul></nav>`;
  document.currentScript.replaceWith(header);
  const measureHeader = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
  new ResizeObserver(measureHeader).observe(header);
  measureHeader();
  document.addEventListener('DOMContentLoaded', () => {
    const whatsapp = document.createElement('a');
    whatsapp.className = 'whatsapp-float';
    whatsapp.href = 'https://wa.me/5516991058868';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    whatsapp.dataset.contactField = 'phone-link';
    whatsapp.dataset.contactText = 'false';
    whatsapp.setAttribute('aria-label', 'Fale Conosco pelo WhatsApp');
    whatsapp.innerHTML = `${icon('whatsapp')}<span>Fale Conosco</span>`;
    document.body.append(whatsapp);
    document.querySelectorAll('[data-social-icon]').forEach(node => {
      node.innerHTML = icon(node.dataset.socialIcon);
    });
    window.RPAAuth?.syncContactFields();
  });
})();
