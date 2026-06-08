const aboutModal = document.getElementById('aboutModal');
const openAboutEditor = document.getElementById('openAboutEditor');
const closeAboutEditor = document.getElementById('closeAboutEditor');
const cancelAboutEditor = document.getElementById('cancelAboutEditor');
const aboutForm = document.getElementById('aboutForm');

const aboutFields = {
	introTitle: document.getElementById('aboutIntroTitle'),
	introText: document.getElementById('aboutIntroText'),
	badge1: document.getElementById('aboutBadge1'),
	title1: document.getElementById('aboutTitle1'),
	text1: document.getElementById('aboutText1'),
	image1: document.getElementById('aboutImage1'),
	badge2: document.getElementById('aboutBadge2'),
	title2: document.getElementById('aboutTitle2'),
	text2: document.getElementById('aboutText2'),
	image2: document.getElementById('aboutImage2'),
	badge3: document.getElementById('aboutBadge3'),
	title3: document.getElementById('aboutTitle3'),
	text3: document.getElementById('aboutText3'),
	image3: document.getElementById('aboutImage3')
};

function getAboutContent() {
	return RPADb.getAboutContent();
}

function saveAboutContent(content) {
	RPADb.saveAboutContent(content);
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
		reader.readAsDataURL(file);
	});
}

function renderAbout() {
	const content = getAboutContent();
	const blocks = content.blocks || [];

	aboutFields.introTitle.textContent = content.introTitle || '';
	aboutFields.introText.textContent = content.introText || '';

	blocks.forEach((block, index) => {
		const position = index + 1;
		const badge = document.getElementById(`aboutBadge${position}`);
		const title = document.getElementById(`aboutTitle${position}`);
		const text = document.getElementById(`aboutText${position}`);
		const image = document.getElementById(`aboutImage${position}`);

		if (badge) badge.textContent = block.badge || '';
		if (title) title.textContent = block.title || '';
		if (text) text.textContent = block.text || '';
		if (image && block.imageUrl) {
			image.src = block.imageUrl;
			image.alt = block.imageAlt || block.title || '';
		}
	});
}

function fillAboutForm() {
	const content = getAboutContent();
	const blocks = content.blocks || [];

	document.getElementById('introTitle').value = content.introTitle || '';
	document.getElementById('introText').value = content.introText || '';

	blocks.forEach((block, index) => {
		const position = index + 1;
		document.getElementById(`badge${position}`).value = block.badge || '';
		document.getElementById(`title${position}`).value = block.title || '';
		document.getElementById(`text${position}`).value = block.text || '';
	});
}

function openModal() {
	fillAboutForm();
	aboutModal.classList.add('open');
	aboutModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
	aboutModal.classList.remove('open');
	aboutModal.setAttribute('aria-hidden', 'true');
	aboutForm.reset();
}

openAboutEditor?.addEventListener('click', openModal);
closeAboutEditor?.addEventListener('click', closeModal);
cancelAboutEditor?.addEventListener('click', closeModal);

aboutModal?.addEventListener('click', (event) => {
	if (event.target === aboutModal) {
		closeModal();
	}
});

aboutForm?.addEventListener('submit', async (event) => {
	event.preventDefault();

	if (!RPAAuth.isAdmin()) {
		return;
	}

	const currentContent = getAboutContent();
	const currentBlocks = currentContent.blocks || [];
	const files = [
		document.getElementById('image1').files?.[0],
		document.getElementById('image2').files?.[0],
		document.getElementById('image3').files?.[0]
	];

	try {
		const updatedBlocks = await Promise.all(currentBlocks.map(async (block, index) => {
			const imageFile = files[index];
			return {
				...block,
				badge: document.getElementById(`badge${index + 1}`).value.trim(),
				title: document.getElementById(`title${index + 1}`).value.trim(),
				text: document.getElementById(`text${index + 1}`).value.trim(),
				imageUrl: imageFile ? await readFileAsDataUrl(imageFile) : block.imageUrl,
				imageAlt: document.getElementById(`title${index + 1}`).value.trim() || block.imageAlt
			};
		}));

		const updatedContent = {
			introTitle: document.getElementById('introTitle').value.trim(),
			introText: document.getElementById('introText').value.trim(),
			blocks: updatedBlocks
		};

		saveAboutContent(updatedContent);
		renderAbout();
		closeModal();
		RPAAuth.refresh();
	} catch (error) {
		alert(error.message || 'Falha ao salvar o conteúdo.');
	}
});

function ensureCorrectImagePaths() {
	const content = getAboutContent();
	if (!content.blocks) return;
	
	let hasInvalidPaths = false;
	const blocks = content.blocks.map(block => {
		if (block.imageUrl && !block.imageUrl.startsWith('data:') && !block.imageUrl.includes('../../img/')) {
			hasInvalidPaths = true;
			// Determine which image this should be and map to correct path
			const fileName = block.imageUrl.split('/').pop();
			return {
				...block,
				imageUrl: `../../img/${fileName}`
			};
		}
		return block;
	});
	
	if (hasInvalidPaths) {
		saveAboutContent({ ...content, blocks });
	}
}

ensureCorrectImagePaths();
renderAbout();