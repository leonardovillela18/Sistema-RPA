// Edite aqui a logo, os links da navegação e o botão de WhatsApp de todas as páginas.
(() => {
  const links = [
    ['index.html', 'INÍCIO'], ['servicos.html', 'SERVIÇOS'],
    ['sobre.html', 'SOBRE NÓS'],
    ['contato.html', 'CONTATO']
  ];
  const icons = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/>',
    tiktok: '<path fill="currentColor" stroke="none" d="M16.6 1h-3.7v14.7a3.2 3.2 0 1 1-2.8-3.2V8.7a7 7 0 1 0 6.5 7V8.2a9.1 9.1 0 0 0 5.4 1.7V6.2A5.5 5.5 0 0 1 16.6 1Z"/>',
    whatsapp: '<path fill="currentColor" stroke="none" d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.45 0 .08 5.37.08 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.63a11.98 11.98 0 0 0 5.85 1.49h.01c6.6 0 11.97-5.37 11.98-11.97 0-3.2-1.25-6.21-3.52-8.41ZM12.06 21.84a9.94 9.94 0 0 1-5.06-1.39l-.36-.21-3.68.97.98-3.59-.23-.37a9.9 9.9 0 0 1-1.52-5.28c0-5.48 4.46-9.94 9.95-9.94a9.88 9.88 0 0 1 7.03 2.92 9.89 9.89 0 0 1 2.91 7.04c0 5.48-4.47 9.94-9.95 9.94Zm5.46-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/>'
  };
  const icon = name => `<svg class="social-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
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
