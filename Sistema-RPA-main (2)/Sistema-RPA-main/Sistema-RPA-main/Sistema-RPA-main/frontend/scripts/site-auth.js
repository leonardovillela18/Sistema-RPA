/*
 * TITULO: Modulo de Autenticacao e Permissoes (RPAAuth)
 * FUNCAO: Gerencia login, cadastro, sessao do usuario e regras de exibicao
 * da interface conforme perfil (admin, usuario ou visitante).
 */

window.RPAAuth = (function () {
const API_BASE_URL = window.RPA_USER_API_URL || 'http://localhost:3000';

function safeUser(user) {
	if (!user) {
		return null;
	}

	const { password, ...rest } = user;
	return rest;
}

function currentUser() {
	return RPADb.getSession();
}

function isAdmin() {
	return currentUser()?.role === 'admin';
}

async function postToUserApi(endpoint, payload) {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const data = await response.json();
		if (!response.ok) {
			return {
				ok: false,
				message: data?.message || 'Nao foi possivel concluir a operacao.'
			};
		}

		return data;
	} catch (error) {
		return {
			ok: false,
			message: 'Nao foi possivel conectar ao servidor de usuarios. Inicie o backend em backend/server.js.'
		};
	}
}

async function login(loginValue, passwordValue) {
	const result = await postToUserApi('/api/users/login', {
		login: loginValue,
		password: passwordValue
	});

	if (!result.ok) {
		return result;
	}

	const user = safeUser(result.user);
	RPADb.saveSession({ ...user, token: result.token });
	return { ok: true, user };
}

async function register(payload) {
	const fullName = String(payload.fullName || '').trim();
	const loginValue = String(payload.login || '').trim();
	const email = String(payload.email || '').trim();
	const password = String(payload.password || '').trim();

	if (!fullName || !loginValue || !email || !password) {
		return { ok: false, message: 'Preencha todos os campos.' };
	}

	const result = await postToUserApi('/api/users/register', {
		fullName,
		login: loginValue,
		email,
		password,
	});

	if (!result.ok) {
		return result;
	}

	const user = safeUser(result.user);
	RPADb.saveSession({ ...user, token: result.token });
	return { ok: true, user };
}

function logout() {
	const session = currentUser();
	if (session?.token) {
		fetch(`${API_BASE_URL}/api/users/logout`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${session.token}`
			}
		});
	}
	RPADb.saveSession(null);
}

function getRedirectTarget() {
	const params = new URLSearchParams(window.location.search);
	return params.get('next') || 'index.html';
}

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
	const header = document.querySelector('header');
	if (!header) {
		return;
	}

	const previous = header.querySelector('.auth-actions');
	if (previous) {
		previous.remove();
	}

	const user = currentUser();
	const actions = document.createElement('div');
	actions.className = 'auth-actions';

	if (user) {
		actions.innerHTML = `
			<span class="auth-pill">
				<span>${user.fullName || user.login}</span>
				<span class="auth-role">${user.role === 'admin' ? 'Admin' : 'UsuÃ¡rio'}</span>
			</span>
			<a class="auth-link" href="acesso.html?logout=1">Sair</a>
		`;
	} else {
		actions.innerHTML = `
			<a class="auth-link" href="acesso.html?next=${encodeURIComponent(currentPageFile())}">Entrar</a>
			<a class="auth-link auth-link-primary" href="acesso.html?next=${encodeURIComponent(currentPageFile())}&mode=register">Cadastrar</a>
		`;
	}

	header.appendChild(actions);
}

function syncAdminVisibility(root = document) {
	const adminOnlyNodes = root.querySelectorAll('[data-admin-only]');
	adminOnlyNodes.forEach((node) => {
		node.hidden = !isAdmin();
	});

	document.body?.setAttribute('data-role', isAdmin() ? 'admin' : currentUser() ? 'user' : 'guest');
}

function syncContactFields(root = document) {
	const contacts = RPADb.getContacts();
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
		if (!value) {
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

function logoutAndRedirect() {
	logout();
	window.location.href = `acesso.html?next=${encodeURIComponent(getRedirectTarget())}`;
}

document.addEventListener('DOMContentLoaded', () => refresh(document));

return {
	currentUser,
	isAdmin,
	login,
	register,
	logout,
	logoutAndRedirect,
	getRedirectTarget,
	renderHeaderActions,
	syncAdminVisibility,
	syncContactFields,
	refresh
};
})();