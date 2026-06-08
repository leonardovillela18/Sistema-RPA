/*
 * TITULO: Script Global da Navbar e Barra de Login
 * FUNCAO: Centraliza comportamentos compartilhados da navegacao e acoes de autenticao
 * para refletir em todas as paginas quando este arquivo for alterado.
 */

(function () {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			if (window.RPAAuth && typeof window.RPAAuth.refresh === 'function') {
				window.RPAAuth.refresh(document);
			}
		});
		return;
	}

	if (window.RPAAuth && typeof window.RPAAuth.refresh === 'function') {
		window.RPAAuth.refresh(document);
	}
})();
