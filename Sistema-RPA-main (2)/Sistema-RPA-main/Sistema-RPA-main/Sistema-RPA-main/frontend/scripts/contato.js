const contactModal = document.getElementById('contactModal');
const openContactEditor = document.getElementById('openContactEditor');
const closeContactEditor = document.getElementById('closeContactEditor');
const cancelContactEditor = document.getElementById('cancelContactEditor');
const contactForm = document.getElementById('contactForm');

function fillContactForm() {
	const contacts = RPADb.getContacts();
	document.getElementById('phoneLabel').value = contacts.phoneLabel || '';
	document.getElementById('phoneLink').value = contacts.phoneLink || '';
	document.getElementById('emailLabel').value = contacts.emailLabel || '';
	document.getElementById('emailLink').value = contacts.emailLink || '';
	document.getElementById('instagramLabel').value = contacts.instagramLabel || '';
	document.getElementById('instagramLink').value = contacts.instagramLink || '';
	document.getElementById('address').value = contacts.address || '';
	document.getElementById('mapsLink').value = contacts.mapsLink || '';
	document.getElementById('mapsEmbed').value = contacts.mapsEmbed || '';
}

function openModal() {
	fillContactForm();
	contactModal.classList.add('open');
}

function closeModal() {
	contactModal.classList.remove('open');
}

openContactEditor?.addEventListener('click', openModal);
closeContactEditor?.addEventListener('click', closeModal);
cancelContactEditor?.addEventListener('click', closeModal);

contactModal?.addEventListener('click', (event) => {
	if (event.target === contactModal) {
		closeModal();
	}
});

contactForm?.addEventListener('submit', (event) => {
	event.preventDefault();
	RPADb.saveContacts({
		phoneLabel: document.getElementById('phoneLabel').value.trim(),
		phoneLink: document.getElementById('phoneLink').value.trim(),
		emailLabel: document.getElementById('emailLabel').value.trim(),
		emailLink: document.getElementById('emailLink').value.trim(),
		instagramLabel: document.getElementById('instagramLabel').value.trim(),
		instagramLink: document.getElementById('instagramLink').value.trim(),
		address: document.getElementById('address').value.trim(),
		mapsLink: document.getElementById('mapsLink').value.trim(),
		mapsEmbed: document.getElementById('mapsEmbed').value.trim()
	});
	RPAAuth.syncContactFields();
	closeModal();
});