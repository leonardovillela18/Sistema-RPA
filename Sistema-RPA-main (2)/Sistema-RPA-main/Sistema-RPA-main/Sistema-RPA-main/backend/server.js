/*
 * TITULO: Servidor Backend Principal
 * FUNCAO: Disponibiliza o site em HTTP, executa autenticacao de usuarios,
 * controla permissoes de acesso e persiste dados do sistema no banco em arquivo.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const DB_DIR = path.join(__dirname, 'database');
const APP_DB_PATH = path.join(DB_DIR, 'app-db.json');
const PROJECT_ROOT = path.join(__dirname, '..');
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const PAGE_FILE_NAMES = new Set([
  'index.html',
  'acesso.html',
  'servicos.html',
  'produtos.html',
  'sobre.html',
  'contato.html'
]);

const DEFAULT_CONTACTS = {
  phoneLabel: '+55 16 99105-8868',
  phoneLink: 'https://wa.me/5516991058868',
  emailLabel: 'Comercial@rpamecanica.com.br',
  emailLink: 'mailto:Comercial@rpamecanica.com.br',
  instagramLabel: '@mecanica_diesel_rpa',
  instagramLink: 'https://www.instagram.com/mecanica_diesel_rpa/',
  address: 'R. Profa. Regina Lucia Bin Caun - Porto Seguro, Ribeirao Preto - SP, 14079-602',
  mapsLink:
    'https://www.google.com/maps/search/?api=1&query=R.%20Profa.%20Regina%20Lucia%20Bin%20Caun%20-%20Porto%20Seguro%2C%20Ribeirao%20Preto%20-%20SP%2C%2014079-602',
  mapsEmbed:
    'https://www.google.com/maps?q=R.%20Profa.%20Regina%20Lucia%20Bin%20Caun%20-%20Porto%20Seguro%2C%20Ribeirao%20Preto%20-%20SP%2C%2014079-602&output=embed'
};

const DEFAULT_ABOUT = {
  introTitle: 'Sobre Nos - RPA Pecas Automotivas',
  introText:
    'Atuamos com pecas e servicos mecanicos para linha pesada, unindo atendimento tecnico, agilidade no diagnostico e compromisso com a seguranca das operacoes.',
  blocks: [
    {
      badge: 'DESDE 2012',
      title: 'Nossa Historia',
      text:
        'Fundada em 2012, a RPA Pecas nasceu com o objetivo de oferecer pecas e manutencao especializada para caminhoes pesados. Com crescimento constante, estruturamos nosso estoque e processos para atender com rapidez transportadoras e autonomos da regiao.',
      imageUrl: '../../img/RPA_Logo.jpeg',
      imageAlt: 'Logo da RPA Pecas Automotivas',
      inversed: false
    },
    {
      badge: 'RELACIONAMENTO',
      title: 'Parcerias',
      text:
        'Trabalhamos com transportadoras, empresas logisticas e oficinas especializadas em toda a regiao. Nossas parcerias sao baseadas em confianca, disponibilidade de pecas e suporte tecnico continuo para reduzir paradas inesperadas.',
      imageUrl: '../../img/imj_sobre1.jpg',
      imageAlt: 'Profissional em manutencao de caminhoes',
      inversed: true
    },
    {
      badge: 'PROCESSO',
      title: 'Como Funcionamos',
      text:
        'Nossa empresa atua com estoque proprio, atendimento rapido e equipe tecnica especializada em montagem, troca e reparos. Cada servico segue checklist de inspecao para garantir desempenho, seguranca e maior vida util dos componentes.',
      imageUrl: '../../img/imj_sobre2.jpg',
      imageAlt: 'Caminhao em manutencao na oficina',
      inversed: false
    }
  ]
};

function createPasswordHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
}

function createUser(fullName, login, email, rawPassword, role = 'user') {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = createPasswordHash(rawPassword, salt);
  return {
    fullName,
    login,
    email,
    role,
    passwordSalt: salt,
    passwordHash
  };
}

const ADMIN_USER = createUser('Administrador do Sistema', 'admin', 'admin@rpa.local', 'admin1', 'admin');

function createDefaultDb() {
  return {
    users: [ADMIN_USER],
    sessions: [],
    products: [],
    contacts: DEFAULT_CONTACTS,
    about: DEFAULT_ABOUT
  };
}

function clampString(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeProduct(item) {
  return {
    id: clampString(item?.id, 80),
    name: clampString(item?.name, 120),
    price: clampString(item?.price, 40),
    shortDescription: clampString(item?.shortDescription, 320),
    details: clampString(item?.details, 1200),
    imageAlt: clampString(item?.imageAlt || item?.name, 140),
    imageUrl: String(item?.imageUrl || '').slice(0, 2000000)
  };
}

function normalizeContacts(contacts) {
  return {
    phoneLabel: clampString(contacts?.phoneLabel, 80),
    phoneLink: clampString(contacts?.phoneLink, 300),
    emailLabel: clampString(contacts?.emailLabel, 120),
    emailLink: clampString(contacts?.emailLink, 300),
    instagramLabel: clampString(contacts?.instagramLabel, 120),
    instagramLink: clampString(contacts?.instagramLink, 300),
    address: clampString(contacts?.address, 300),
    mapsLink: clampString(contacts?.mapsLink, 500),
    mapsEmbed: clampString(contacts?.mapsEmbed, 500)
  };
}

function normalizeAbout(about) {
  const defaultAbout = DEFAULT_ABOUT;
  const inputBlocks = Array.isArray(about?.blocks) ? about.blocks : defaultAbout.blocks;
  const blocks = inputBlocks.slice(0, 3).map((block, index) => ({
    badge: clampString(block?.badge || defaultAbout.blocks[index]?.badge, 80),
    title: clampString(block?.title || defaultAbout.blocks[index]?.title, 120),
    text: clampString(block?.text || defaultAbout.blocks[index]?.text, 2000),
    imageUrl: String(block?.imageUrl || defaultAbout.blocks[index]?.imageUrl || '').slice(0, 2000000),
    imageAlt: clampString(block?.imageAlt || defaultAbout.blocks[index]?.imageAlt, 180),
    inversed: Boolean(block?.inversed)
  }));

  return {
    introTitle: clampString(about?.introTitle || defaultAbout.introTitle, 180),
    introText: clampString(about?.introText || defaultAbout.introText, 2000),
    blocks
  };
}

function normalizeUsers(users) {
  const list = Array.isArray(users) ? users : [];
  return list
    .map((user) => {
      const fullName = clampString(user?.fullName, 120);
      const login = clampString(user?.login, 50).toLowerCase();
      const email = clampString(user?.email, 120).toLowerCase();
      const role = user?.role === 'admin' ? 'admin' : 'user';

      if (
        login === ADMIN_USER.login &&
        (user?.password === 'admin1' || user?.passwordHash === 'migrate-on-start' || user?.passwordSalt === 'migrate-on-start')
      ) {
        return ADMIN_USER;
      }

      if (user?.passwordHash && user?.passwordSalt) {
        return { fullName, login, email, role, passwordHash: user.passwordHash, passwordSalt: user.passwordSalt };
      }

      if (user?.password) {
        const migrated = createUser(fullName, login, email, String(user.password), role);
        return migrated;
      }

      return null;
    })
    .filter(Boolean);
}

function normalizeDb(rawDb) {
  const defaultDb = createDefaultDb();
  const users = normalizeUsers(rawDb?.users);
  const hasAdmin = users.some((user) => user.login === ADMIN_USER.login);
  if (!hasAdmin) {
    users.unshift(ADMIN_USER);
  }

  const sessions = Array.isArray(rawDb?.sessions)
    ? rawDb.sessions.filter((session) => session?.token && session?.login && Number(session?.expiresAt) > Date.now())
    : [];

  const products = Array.isArray(rawDb?.products) ? rawDb.products.map(normalizeProduct) : defaultDb.products;

  return {
    users,
    sessions,
    products,
    contacts:
      rawDb?.contacts && typeof rawDb.contacts === 'object'
        ? normalizeContacts(rawDb.contacts)
        : defaultDb.contacts,
    about: rawDb?.about && typeof rawDb.about === 'object' ? normalizeAbout(rawDb.about) : defaultDb.about
  };
}

function ensureAppDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(APP_DB_PATH)) {
    fs.writeFileSync(APP_DB_PATH, JSON.stringify(createDefaultDb(), null, 2), 'utf8');
    return;
  }

  writeAppDb(readAppDb());
}

function readAppDb() {
  try {
    const raw = fs.readFileSync(APP_DB_PATH, 'utf8');
    return normalizeDb(JSON.parse(raw));
  } catch (error) {
    return createDefaultDb();
  }
}

function writeAppDb(db) {
  fs.writeFileSync(APP_DB_PATH, JSON.stringify(normalizeDb(db), null, 2), 'utf8');
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  response.end(JSON.stringify(payload));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 6 * 1024 * 1024) {
        request.destroy();
        reject(new Error('Payload muito grande.'));
      }
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('JSON invalido.'));
      }
    });
    request.on('error', (error) => reject(error));
  });
}

function stripSensitiveUserData(user) {
  const { passwordHash, passwordSalt, password, ...safeUser } = user;
  return safeUser;
}

function verifyPassword(user, plainPassword) {
  if (!user?.passwordHash || !user?.passwordSalt) {
    return false;
  }
  const providedHash = createPasswordHash(plainPassword, user.passwordSalt);
  const expected = Buffer.from(user.passwordHash, 'hex');
  const actual = Buffer.from(providedHash, 'hex');
  if (expected.length !== actual.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, actual);
}

function createSessionForUser(db, user) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions = db.sessions.filter((session) => Number(session.expiresAt) > Date.now());
  db.sessions.push({
    token,
    login: user.login,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return token;
}

function getBearerToken(request) {
  const authHeader = String(request.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length).trim();
}

function getAuthContext(request, db) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const session = db.sessions.find((item) => item.token === token && Number(item.expiresAt) > Date.now());
  if (!session) {
    return null;
  }

  const user = db.users.find((item) => item.login === session.login);
  if (!user) {
    return null;
  }

  return { token, session, user };
}

function requireAdmin(request, response, db) {
  const auth = getAuthContext(request, db);
  if (!auth) {
    sendJson(response, 401, { ok: false, message: 'Nao autenticado.' });
    return null;
  }

  if (auth.user.role !== 'admin') {
    sendJson(response, 403, { ok: false, message: 'Acesso bloqueado para este perfil.' });
    return null;
  }

  return auth;
}

function getPublicSnapshot(db) {
  return {
    products: db.products,
    contacts: db.contacts,
    about: db.about
  };
}

function safeResolveProjectPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^([\\/])+/, '');
  const absolutePath = path.join(PROJECT_ROOT, normalizedPath);
  if (!absolutePath.startsWith(PROJECT_ROOT)) {
    return null;
  }
  return absolutePath;
}

function sendFile(response, filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return false;
  }
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(response);
  return true;
}

function handleStatic(request, response) {
  if (request.method !== 'GET') {
    return false;
  }
  if (request.url === '/' || request.url === '') {
    response.writeHead(302, { Location: '/frontend/pages/index.html' });
    response.end();
    return true;
  }

  const cleanPath = (request.url || '').split('?')[0];
  if (cleanPath.startsWith('/styles/')) {
    return sendFile(response, path.join(PROJECT_ROOT, 'frontend', cleanPath.replace(/^\//, '')));
  }
  if (cleanPath.startsWith('/scripts/')) {
    return sendFile(response, path.join(PROJECT_ROOT, 'frontend', cleanPath.replace(/^\//, '')));
  }
  if (cleanPath.startsWith('/img/')) {
    return sendFile(response, path.join(PROJECT_ROOT, cleanPath.replace(/^\//, '')));
  }

  const rootFileName = cleanPath.replace(/^\//, '');
  if (PAGE_FILE_NAMES.has(rootFileName)) {
    return sendFile(response, path.join(PROJECT_ROOT, 'frontend', 'pages', rootFileName));
  }

  const resolvedPath = safeResolveProjectPath(request.url || '');
  if (!resolvedPath) {
    sendJson(response, 400, { ok: false, message: 'Caminho invalido.' });
    return true;
  }

  if (sendFile(response, resolvedPath)) {
    return true;
  }

  return sendFile(response, path.join(PROJECT_ROOT, 'frontend', 'pages', (request.url || '').replace(/^\//, '')));
}

function getDbEntityKey(urlPath) {
  const routeMatch = urlPath.match(/^\/api\/db\/(users|products|contacts|about)$/);
  return routeMatch ? routeMatch[1] : null;
}

function parseAndValidateEntity(key, rawValue) {
  if (key === 'products') {
    if (!Array.isArray(rawValue)) {
      throw new Error('Products deve ser uma lista.');
    }
    return rawValue.map(normalizeProduct);
  }

  if (key === 'contacts') {
    if (!rawValue || typeof rawValue !== 'object') {
      throw new Error('Contacts invalido.');
    }
    return normalizeContacts(rawValue);
  }

  if (key === 'about') {
    if (!rawValue || typeof rawValue !== 'object') {
      throw new Error('About invalido.');
    }
    return normalizeAbout(rawValue);
  }

  if (key === 'users') {
    if (!Array.isArray(rawValue)) {
      throw new Error('Users deve ser uma lista.');
    }
    return normalizeUsers(rawValue);
  }

  throw new Error('Entidade invalida.');
}

async function handleLogin(request, response) {
  try {
    const payload = await parseBody(request);
    const loginValue = clampString(payload.login, 60).toLowerCase();
    const password = String(payload.password || '');

    if (!loginValue || !password) {
      sendJson(response, 400, { ok: false, message: 'Informe login e senha.' });
      return;
    }

    const db = readAppDb();
    const matchedUser = db.users.find((user) => user.login === loginValue);
    if (!matchedUser || !verifyPassword(matchedUser, password)) {
      sendJson(response, 401, { ok: false, message: 'Login ou senha incorretos.' });
      return;
    }

    const token = createSessionForUser(db, matchedUser);
    writeAppDb(db);
    sendJson(response, 200, { ok: true, user: stripSensitiveUserData(matchedUser), token });
  } catch (error) {
    sendJson(response, 400, { ok: false, message: error.message || 'Erro ao processar login.' });
  }
}

async function handleRegister(request, response) {
  try {
    const payload = await parseBody(request);
    const fullName = clampString(payload.fullName, 120);
    const loginValue = clampString(payload.login, 50).toLowerCase();
    const email = clampString(payload.email, 120).toLowerCase();
    const password = String(payload.password || '').trim();

    if (!fullName || !loginValue || !email || !password) {
      sendJson(response, 400, { ok: false, message: 'Preencha todos os campos.' });
      return;
    }

    const db = readAppDb();
    if (db.users.some((user) => user.login === loginValue)) {
      sendJson(response, 409, { ok: false, message: 'Esse login ja existe.' });
      return;
    }
    if (db.users.some((user) => user.email === email)) {
      sendJson(response, 409, { ok: false, message: 'Esse email ja esta cadastrado.' });
      return;
    }

    const newUser = createUser(fullName, loginValue, email, password, 'user');
    db.users.push(newUser);
    const token = createSessionForUser(db, newUser);
    writeAppDb(db);

    sendJson(response, 201, { ok: true, user: stripSensitiveUserData(newUser), token });
  } catch (error) {
    sendJson(response, 400, { ok: false, message: error.message || 'Erro ao processar cadastro.' });
  }
}

function handleLogout(request, response) {
  const db = readAppDb();
  const token = getBearerToken(request);
  if (!token) {
    sendJson(response, 200, { ok: true });
    return;
  }

  db.sessions = db.sessions.filter((session) => session.token !== token);
  writeAppDb(db);
  sendJson(response, 200, { ok: true });
}

function handleDbRead(request, response) {
  const key = getDbEntityKey(request.url || '');
  if (!key) {
    return false;
  }

  const db = readAppDb();
  if (key === 'users') {
    const auth = requireAdmin(request, response, db);
    if (!auth) {
      return true;
    }
    sendJson(response, 200, { ok: true, data: db.users.map(stripSensitiveUserData) });
    return true;
  }

  sendJson(response, 200, { ok: true, data: db[key] });
  return true;
}

async function handleDbWrite(request, response) {
  const key = getDbEntityKey(request.url || '');
  if (!key) {
    sendJson(response, 404, { ok: false, message: 'Rota nao encontrada.' });
    return;
  }

  const db = readAppDb();
  const auth = requireAdmin(request, response, db);
  if (!auth) {
    return;
  }

  try {
    const payload = await parseBody(request);
    if (payload?.data === undefined) {
      sendJson(response, 400, { ok: false, message: 'Campo data obrigatorio.' });
      return;
    }

    db[key] = parseAndValidateEntity(key, payload.data);
    writeAppDb(db);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    sendJson(response, 400, { ok: false, message: error.message || 'Erro ao salvar dados.' });
  }
}

function requestHandler(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true, message: 'API online.' });
    return;
  }

  if (request.method === 'GET' && request.url === '/api/public/snapshot') {
    sendJson(response, 200, { ok: true, data: getPublicSnapshot(readAppDb()) });
    return;
  }

  if (request.method === 'GET' && request.url === '/api/db/snapshot') {
    sendJson(response, 200, { ok: true, data: getPublicSnapshot(readAppDb()) });
    return;
  }

  if (request.method === 'POST' && request.url === '/api/users/login') {
    handleLogin(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/users/register') {
    handleRegister(request, response);
    return;
  }

  if (request.method === 'POST' && request.url === '/api/users/logout') {
    handleLogout(request, response);
    return;
  }

  if (request.method === 'GET' && (request.url || '').startsWith('/api/db/')) {
    if (handleDbRead(request, response)) {
      return;
    }
  }

  if (request.method === 'POST' && (request.url || '').startsWith('/api/db/')) {
    handleDbWrite(request, response);
    return;
  }

  if (handleStatic(request, response)) {
    return;
  }

  sendJson(response, 404, { ok: false, message: 'Rota nao encontrada.' });
}

ensureAppDb();

const server = http.createServer(requestHandler);
server.listen(PORT, () => {
  console.log(`RPA app rodando em http://localhost:${PORT}`);
});
