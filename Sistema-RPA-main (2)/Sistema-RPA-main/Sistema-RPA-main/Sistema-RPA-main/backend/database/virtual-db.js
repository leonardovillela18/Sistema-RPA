/*
 * TITULO: Camada de Banco no Frontend (RPADb)
 * FUNCAO: Centraliza leitura/escrita de dados no navegador, sincroniza com a API
 * do backend e expoe metodos unificados para usuarios, produtos, contatos e conteudo.
 */

window.RPADb = (function () {
const API_BASE_URL = window.RPA_USER_API_URL || 'http://localhost:3000';

const KEYS = {
	users: 'rpa-users-db',
	session: 'rpa-session-db',
	products: 'rpa-products-db',
	contacts: 'rpa-contacts-db',
	about: 'rpa-about-db'
};

const API_ENTITIES = {
	users: 'users',
	products: 'products',
	contacts: 'contacts',
	about: 'about'
};

const DEFAULT_CONTACTS = {
	phoneLabel: '+55 16 99105-8868',
	phoneLink: 'https://wa.me/5516991058868',
	emailLabel: 'Comercial@rpamecanica.com.br',
	emailLink: 'mailto:Comercial@rpamecanica.com.br',
	instagramLabel: '@mecanica_diesel_rpa',
	instagramLink: 'https://www.instagram.com/mecanica_diesel_rpa/',
	address: 'R. Profa. Regina Lúcia Bin Caun - Porto Seguro, Ribeirão Preto - SP, 14079-602',
	mapsLink: 'https://www.google.com/maps/search/?api=1&query=R.%20Profa.%20Regina%20L%C3%BAcia%20Bin%20Caun%20-%20Porto%20Seguro%2C%20Ribeir%C3%A3o%20Preto%20-%20SP%2C%2014079-602',
	mapsEmbed: 'https://www.google.com/maps?q=R.%20Profa.%20Regina%20L%C3%BAcia%20Bin%20Caun%20-%20Porto%20Seguro%2C%20Ribeir%C3%A3o%20Preto%20-%20SP%2C%2014079-602&output=embed'
};

const DEFAULT_ABOUT = {
	introTitle: 'Sobre Nós - RPA Peças Automotivas',
	introText: 'Atuamos com peças e serviços mecânicos para linha pesada, unindo atendimento técnico, agilidade no diagnóstico e compromisso com a segurança das operações.',
	blocks: [
		{
			badge: 'DESDE 2012',
			title: 'Nossa História',
			text: 'Fundada em 2012, a RPA Peças nasceu com o objetivo de oferecer peças e manutenção especializada para caminhões pesados. Com crescimento constante, estruturamos nosso estoque e processos para atender com rapidez transportadoras e autônomos da região.',
			imageUrl: '../../img/RPA_Logo.jpeg',
			imageAlt: 'Logo da RPA Peças Automotivas',
			inversed: false
		},
		{
			badge: 'RELACIONAMENTO',
			title: 'Parcerias',
			text: 'Trabalhamos com transportadoras, empresas logísticas e oficinas especializadas em toda a região. Nossas parcerias são baseadas em confiança, disponibilidade de peças e suporte técnico contínuo para reduzir paradas inesperadas.',
			imageUrl: '../../img/imj_sobre1.jpg',
			imageAlt: 'Profissional em manutenção de caminhões',
			inversed: true
		},
		{
			badge: 'PROCESSO',
			title: 'Como Funcionamos',
			text: 'Nossa empresa atua com estoque próprio, atendimento rápido e equipe técnica especializada em montagem, troca e reparos. Cada serviço segue checklist de inspeção para garantir desempenho, segurança e maior vida útil dos componentes.',
			imageUrl: '../../img/imj_sobre2.jpg',
			imageAlt: 'Caminhão em manutenção na oficina',
			inversed: false
		}
	]
};

const ADMIN_USER = {
	fullName: 'Administrador do Sistema',
	login: 'admin',
	email: 'admin@rpa.local',
	password: 'admin1',
	role: 'admin'
};

function read(key, fallback) {
	const rawValue = localStorage.getItem(key);
	if (rawValue === null) {
		return fallback;
	}

	try {
		return JSON.parse(rawValue);
	} catch (error) {
		return fallback;
	}
}

function write(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function getStoredSession() {
	return read(KEYS.session, null);
}

function requestJsonSync(method, endpoint, payload) {
	try {
		const request = new XMLHttpRequest();
		request.open(method, `${API_BASE_URL}${endpoint}`, false);
		request.setRequestHeader('Content-Type', 'application/json');
		const session = getStoredSession();
		if (session?.token) {
			request.setRequestHeader('Authorization', `Bearer ${session.token}`);
		}
		request.send(payload ? JSON.stringify(payload) : null);

		if (request.status < 200 || request.status >= 300) {
			return null;
		}

		return request.responseText ? JSON.parse(request.responseText) : null;
	} catch (error) {
		return null;
	}
}

function pushToServer(entity, value) {
	requestJsonSync('POST', `/api/db/${entity}`, { data: value });
}

function loadFromServer() {
	const snapshot = requestJsonSync('GET', '/api/public/snapshot');
	if (!snapshot?.ok || !snapshot.data) {
		return;
	}

	const data = snapshot.data;
	if (Array.isArray(data.users)) {
		write(KEYS.users, data.users);
	}

	if (Array.isArray(data.products)) {
		write(KEYS.products, data.products);
	}

	if (data.contacts && typeof data.contacts === 'object') {
		write(KEYS.contacts, data.contacts);
	}

	if (data.about && typeof data.about === 'object') {
		write(KEYS.about, data.about);
	}
}

function ensureSeedData() {
	const users = read(KEYS.users, []);
	if (!users.some((user) => String(user.login).toLowerCase() === ADMIN_USER.login)) {
		users.unshift(ADMIN_USER);
		write(KEYS.users, users);
	}

	if (localStorage.getItem(KEYS.contacts) === null) {
		write(KEYS.contacts, DEFAULT_CONTACTS);
	}

	if (localStorage.getItem(KEYS.products) === null) {
		write(KEYS.products, []);
	}

	if (localStorage.getItem(KEYS.about) === null) {
		write(KEYS.about, DEFAULT_ABOUT);
	}

	loadFromServer();
}

function getUsers() {
	return read(KEYS.users, []);
}

function saveUsers(users) {
	write(KEYS.users, users);
	pushToServer(API_ENTITIES.users, users);
}

function getSession() {
	return read(KEYS.session, null);
}

function saveSession(session) {
	if (session) {
		write(KEYS.session, session);
		return;
	}

	localStorage.removeItem(KEYS.session);
}

function getProducts() {
	return read(KEYS.products, []);
}

function saveProducts(products) {
	write(KEYS.products, products);
	pushToServer(API_ENTITIES.products, products);
}

function getContacts() {
	return read(KEYS.contacts, DEFAULT_CONTACTS);
}

function saveContacts(contacts) {
	write(KEYS.contacts, contacts);
	pushToServer(API_ENTITIES.contacts, contacts);
}

function getAboutContent() {
	return read(KEYS.about, DEFAULT_ABOUT);
}

function saveAboutContent(aboutContent) {
	write(KEYS.about, aboutContent);
	pushToServer(API_ENTITIES.about, aboutContent);
}

function createId(prefix) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

ensureSeedData();

return {
	keys: KEYS,
	defaults: {
		contacts: DEFAULT_CONTACTS,
		admin: ADMIN_USER
	},
	createId,
	getUsers,
	saveUsers,
	getSession,
	saveSession,
	getProducts,
	saveProducts,
	getContacts,
	saveContacts,
	getAboutContent,
	saveAboutContent
};
})();