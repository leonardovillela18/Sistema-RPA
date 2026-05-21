window.RPAAuth = (function () {
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

function login(loginValue, passwordValue) {
	const users = RPADb.getUsers();
	const matchedUser = users.find((user) => user.login === loginValue && user.password === passwordValue);

	if (!matchedUser) {
		return { ok: false, message: 'Login ou senha incorretos.' };
	}

	RPADb.saveSession(safeUser(matchedUser));
	return { ok: true, user: safeUser(matchedUser) };
}

function register(payload) {
	const fullName = String(payload.fullName || '').trim();
	const loginValue = String(payload.login || '').trim();
	const email = String(payload.email || '').trim();
	const password = String(payload.password || '').trim();

	if (!fullName || !loginValue || !email || !password) {
		return { ok: false, message: 'Preencha todos os campos.' };
	}

	const users = RPADb.getUsers();
	const duplicateLogin = users.some((user) => String(user.login).toLowerCase() === loginValue.toLowerCase());
	const duplicateEmail = users.some((user) => String(user.email).toLowerCase() === email.toLowerCase());

	if (duplicateLogin) {
		return { ok: false, message: 'Esse login já existe.' };
	}

	if (duplicateEmail) {
		return { ok: false, message: 'Esse email já está cadastrado.' };
	}

	const newUser = {
		fullName,
		login: loginValue,
		email,
		password,
		role: 'user'
	};

	users.push(newUser);
	RPADb.saveUsers(users);
	RPADb.saveSession(safeUser(newUser));
	return { ok: true, user: safeUser(newUser) };
}

function logout() {
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
				<span class="auth-role">${user.role === 'admin' ? 'Admin' : 'Usuário'}</span>
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