const messageEl = document.getElementById('authMessage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginUser = document.getElementById('loginUser');
const loginPassword = document.getElementById('loginPassword');
const switchLogin = document.getElementById('switchLogin');
const switchRegister = document.getElementById('switchRegister');
const params = new URLSearchParams(window.location.search);

function showMessage(text, type) {
	messageEl.textContent = text;
	messageEl.className = `message ${type || ''}`.trim();
}

function setPanel(mode) {
	const showLogin = mode !== 'register';
	loginForm.classList.toggle('active', showLogin);
	registerForm.classList.toggle('active', !showLogin);
	switchLogin.classList.toggle('active', showLogin);
	switchRegister.classList.toggle('active', !showLogin);
}

switchLogin.addEventListener('click', () => setPanel('login'));
switchRegister.addEventListener('click', () => setPanel('register'));

if (params.get('logout') === '1') {
	RPAAuth.logout();
	try {
		sessionStorage.clear();
	} catch (error) {
		// ignore storage errors
	}
	showMessage('Logout realizado. Faça login novamente.', 'success');
	setPanel('login');
}

if (params.get('mode') === 'register') {
	setPanel('register');
}

loginForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	const result = await RPAAuth.login(loginUser.value.trim(), loginPassword.value.trim());
	if (!result.ok) {
		showMessage(result.message, 'error');
		return;
	}

	showMessage('Login realizado com sucesso.', 'success');
	setTimeout(() => {
		window.location.href = 'index.html';
	}, 350);
});

registerForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	const result = await RPAAuth.register({
		fullName: document.getElementById('fullName').value,
		login: document.getElementById('registerLogin').value,
		email: document.getElementById('registerEmail').value,
		password: document.getElementById('registerPassword').value
	});

	if (!result.ok) {
		showMessage(result.message, 'error');
		return;
	}

	showMessage('Cadastro realizado com sucesso.', 'success');
	setTimeout(() => {
		window.location.href = 'index.html';
	}, 350);
});

// Admin Contact Editor
const adminContactModal = document.getElementById('adminContactModal');
const openAdminContactEditor = document.getElementById('openAdminContactEditor');
const closeAdminContactEditor = document.getElementById('closeAdminContactEditor');
const cancelAdminContactEditor = document.getElementById('cancelAdminContactEditor');
const adminContactForm = document.getElementById('adminContactForm');

function fillAdminContactForm() {
	const contacts = RPADb.getContacts();
	document.getElementById('adminPhoneLabel').value = contacts.phoneLabel || '';
	document.getElementById('adminPhoneLink').value = contacts.phoneLink || '';
	document.getElementById('adminEmailLabel').value = contacts.emailLabel || '';
	document.getElementById('adminEmailLink').value = contacts.emailLink || '';
	document.getElementById('adminInstagramLabel').value = contacts.instagramLabel || '';
	document.getElementById('adminInstagramLink').value = contacts.instagramLink || '';
	document.getElementById('adminAddress').value = contacts.address || '';
	document.getElementById('adminMapsLink').value = contacts.mapsLink || '';
	document.getElementById('adminMapsEmbed').value = contacts.mapsEmbed || '';
}

function openAdminContactModal() {
	fillAdminContactForm();
	adminContactModal.classList.add('open');
}

function closeAdminContactModal() {
	adminContactModal.classList.remove('open');
}

openAdminContactEditor?.addEventListener('click', openAdminContactModal);
closeAdminContactEditor?.addEventListener('click', closeAdminContactModal);
cancelAdminContactEditor?.addEventListener('click', closeAdminContactModal);

adminContactModal?.addEventListener('click', (event) => {
	if (event.target === adminContactModal) {
		closeAdminContactModal();
	}
});

adminContactForm?.addEventListener('submit', (event) => {
	event.preventDefault();
	RPADb.saveContacts({
		phoneLabel: document.getElementById('adminPhoneLabel').value.trim(),
		phoneLink: document.getElementById('adminPhoneLink').value.trim(),
		emailLabel: document.getElementById('adminEmailLabel').value.trim(),
		emailLink: document.getElementById('adminEmailLink').value.trim(),
		instagramLabel: document.getElementById('adminInstagramLabel').value.trim(),
		instagramLink: document.getElementById('adminInstagramLink').value.trim(),
		address: document.getElementById('adminAddress').value.trim(),
		mapsLink: document.getElementById('adminMapsLink').value.trim(),
		mapsEmbed: document.getElementById('adminMapsEmbed').value.trim()
	});
	RPAAuth.syncContactFields();
	closeAdminContactModal();
	showMessage('Contatos atualizados com sucesso!', 'success');
});
