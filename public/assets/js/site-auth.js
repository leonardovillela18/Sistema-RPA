window.RPAAuth = (() => {
let user = null;
const currentUser = () => user;
const isAdmin = () => Boolean(user);
async function loadSession() { const result = await RPAApi.request('/api/auth/me.php'); user=result.user; RPAApi.setCsrf(result.csrf); refresh(); }
async function login(login,password) { await RPAApi.request('/api/auth/login.php',{login,password}); await loadSession(); }
async function logout() { await RPAApi.request('/api/auth/logout.php',{}); user=null; refresh(); }
function getRedirectTarget() { const next=new URLSearchParams(location.search).get('next'); if(next==='usuarios.html' && !isAdmin()) return '/index.html'; return ['index.html','produtos.html','contato.html','sobre.html','servicos.html','usuarios.html'].includes(next) ? '/'+next : (isAdmin()?'/usuarios.html':'/index.html'); }
function currentPageFile() {
	const fileName = window.location.pathname.split('/').pop();
	return fileName || 'index.html';
}

function normalizeFileName(href) {
	try {
		const url = new URL(href, window.location.href);
		const fileName = url.pathname.split('/').pop();
		return fileName || 'index.html';
	} catch (error) {
		return href;
	}
}

function syncNavState() {
	const currentFile = currentPageFile();
	const navLinks = document.querySelectorAll('header nav a');

	navLinks.forEach((link) => {
		const targetFile = normalizeFileName(link.getAttribute('href') || '');
		const isCurrent = targetFile === currentFile;
		link.classList.toggle('active', isCurrent);
		if (isCurrent) {
			link.setAttribute('aria-current', 'page');
		} else {
			link.removeAttribute('aria-current');
		}
	});
}

function renderHeaderActions() {
 const header = document.querySelector('header'); if (!header) return;
 header.querySelector('.auth-actions')?.remove();
 const actions = document.createElement('div'); actions.className = 'auth-actions';
 if(isAdmin()) {
  const usersLink=document.createElement('a'); usersLink.className='auth-link';
  usersLink.href='/usuarios.html'; usersLink.textContent='Administradores';
  if(currentPageFile()==='usuarios.html') usersLink.setAttribute('aria-current','page');
  actions.append(usersLink);
 }
 const link = document.createElement('a'); link.className = 'auth-link';
 link.href = '/acesso.html'; link.textContent = user ? 'Sair' : 'Entrar';
 if(user) link.addEventListener('click', async e => { e.preventDefault(); try { await logout(); location.href='/index.html'; } catch(e) { alert(e.message); } });
 actions.append(link); header.append(actions);
}
function syncAdminVisibility(root = document) {
	const adminOnlyNodes = root.querySelectorAll('[data-admin-only]');
	adminOnlyNodes.forEach((node) => {
		node.hidden = !isAdmin();
	});
}

function syncContactFields(root = document) {
	const contacts = RPAApi.getContacts();
	const fieldValues = {
		'phone-text': contacts.phoneLabel,
		'phone-link': contacts.phoneLink,
		'email-text': contacts.emailLabel,
		'email-link': contacts.emailLink,
		'instagram-text': contacts.instagramLabel,
		'instagram-link': contacts.instagramLink,
		'address-text': contacts.address,
		'maps-link': contacts.mapsLink,
		'maps-iframe': contacts.mapsEmbed
	};

	root.querySelectorAll('[data-contact-field]').forEach((node) => {
		const field = node.dataset.contactField;
		const value = fieldValues[field];
		if (value === undefined) {
			return;
		}

		if (field === 'maps-iframe') {
			node.src = value;
			return;
		}

		if (node.tagName === 'A') {
			node.href = value;
			if (node.dataset.contactText !== 'false') {
				node.textContent = value;
			}
			return;
		}

		node.textContent = value;
	});
}

function refresh(root = document) {
	syncNavState();
	renderHeaderActions();
	syncAdminVisibility(root);
	syncContactFields(root);
}


refresh();
const ready = Promise.all([RPAApi.ready, loadSession()]).then(() => refresh());
ready.catch(RPAApi.showError);
return {currentUser,isAdmin,login,logout,getRedirectTarget,refresh,syncContactFields,ready};
})();
