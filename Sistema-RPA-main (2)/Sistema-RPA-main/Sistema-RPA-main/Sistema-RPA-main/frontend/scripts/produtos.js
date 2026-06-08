const productsGrid = document.getElementById('productsGrid');
const productModal = document.getElementById('productModal');
const productDetailsModal = document.getElementById('productDetailsModal');
const productForm = document.getElementById('productForm');
const openProductModal = document.getElementById('openProductModal');
const closeProductModal = document.getElementById('closeProductModal');
const cancelProductModal = document.getElementById('cancelProductModal');
const closeProductDetailsModal = document.getElementById('closeProductDetailsModal');
const closeProductDetailsFooter = document.getElementById('closeProductDetailsFooter');
const editingProductId = document.getElementById('editingProductId');
const productSubmitBtn = document.getElementById('productSubmitBtn');
const productDetailsImage = document.getElementById('productDetailsImage');
const productDetailsPrice = document.getElementById('productDetailsPrice');
const productDetailsName = document.getElementById('productDetailsName');
const productDetailsShort = document.getElementById('productDetailsShort');
const productDetailsInfo = document.getElementById('productDetailsInfo');
const productDetailsInfoWrap = document.getElementById('productDetailsInfoWrap');
const productBuyButton = document.getElementById('productBuyButton');

function getProducts(){
	return RPADb.getProducts();
}

function saveProducts(products){
	RPADb.saveProducts(products);
}

function getWhatsAppLink(productName){
	const contacts = RPADb.getContacts();
	const baseLink = contacts.phoneLink || 'https://wa.me/5516991058868';
	const message = productName ? `Olá, gostaria de comprar o produto: ${productName}` : 'Olá, gostaria de fazer uma compra.';

	try{
		const url = new URL(baseLink, window.location.href);
		if(!url.searchParams.has('text')){
			url.searchParams.set('text', message);
		}
		return url.toString();
	}catch(error){
		const separator = baseLink.includes('?') ? '&' : '?';
		return `${baseLink}${separator}text=${encodeURIComponent(message)}`;
	}
}

function escapeHtml(value){
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function formatPrice(value){
	const cleanValue = String(value).trim();
	if(!cleanValue){
		return 'R$ 0,00';
	}

	if(cleanValue.toLowerCase().includes('r$')){
		return cleanValue;
	}

	const normalized = cleanValue.replace(/\./g, '').replace(',', '.');
	const numericValue = Number(normalized);
	if(Number.isNaN(numericValue)){
		return cleanValue.startsWith('R$') ? cleanValue : `R$ ${cleanValue}`;
	}

	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL'
	}).format(numericValue);
}

function openModal(){
	if(!RPAAuth.isAdmin()){
		return;
	}

	productForm.reset();
	editingProductId.value = '';
	productSubmitBtn.textContent = 'Salvar produto';
	productModal.classList.add('open');
	productModal.setAttribute('aria-hidden', 'false');
	document.getElementById('productName').focus();
}

function closeModal(){
	productModal.classList.remove('open');
	productModal.setAttribute('aria-hidden', 'true');
	productForm.reset();
	editingProductId.value = '';
	productSubmitBtn.textContent = 'Salvar produto';
}

function openDetailsModal(product){
	if(!product){
		return;
	}

	productDetailsImage.src = product.imageUrl || '';
	productDetailsImage.alt = product.imageAlt || product.name || 'Produto';
	productDetailsPrice.textContent = formatPrice(product.price || '');
	productDetailsName.textContent = product.name || '';
	productDetailsShort.textContent = product.shortDescription || 'Sem descrição disponível.';
	productDetailsInfo.textContent = product.details || 'Sem informações adicionais.';
	productDetailsInfoWrap.hidden = !product.details;
	productBuyButton.href = getWhatsAppLink(product.name || '');
	productDetailsModal.classList.add('open');
	productDetailsModal.setAttribute('aria-hidden', 'false');
}

function closeDetailsModal(){
	productDetailsModal.classList.remove('open');
	productDetailsModal.setAttribute('aria-hidden', 'true');
}

async function readFileAsDataUrl(file){
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
		reader.readAsDataURL(file);
	});
}

function renderProducts(){
	const products = getProducts();
	const admin = RPAAuth.isAdmin();

	if(products.length === 0){
		productsGrid.innerHTML = admin ? '<div class="empty-state">Nenhum produto cadastrado ainda. Clique em <strong>Novo produto</strong> para criar o primeiro item.</div>' : '<div class="empty-state">Nenhum produto disponível no momento.</div>';
		return;
	}

	productsGrid.innerHTML = products.map((product) => `
		<article class="produto" data-product-id="${escapeHtml(product.id)}">
			<div class="img-wrap">
				<img src="${product.imageUrl}" alt="${escapeHtml(product.imageAlt || product.name)}">
			</div>
			<div class="info">
				<h3>${escapeHtml(product.name)}</h3>
				<p class="preco">${escapeHtml(product.price)}</p>
				<p class="produto-desc">${escapeHtml(product.shortDescription)}</p>
				<p class="produto-hint">Clique para ver detalhes completos</p>
			</div>
			${admin ? `
				<div class="form-actions" style="justify-content:flex-start;margin-top:auto;">
					<button class="secondary-btn" type="button" data-edit-id="${escapeHtml(product.id)}">Editar</button>
					<button class="remove-btn" type="button" data-remove-id="${escapeHtml(product.id)}">Remover produto</button>
				</div>
			` : ''}
		</article>
	`).join('');
}

openProductModal.addEventListener('click', openModal);
closeProductModal.addEventListener('click', closeModal);
cancelProductModal.addEventListener('click', closeModal);

productModal.addEventListener('click', (event) => {
	if(event.target === productModal){
		closeModal();
	}
});

productDetailsModal.addEventListener('click', (event) => {
	if(event.target === productDetailsModal){
		closeDetailsModal();
	}
});

document.addEventListener('keydown', (event) => {
	if(event.key === 'Escape' && productModal.classList.contains('open')){
		closeModal();
	}

	if(event.key === 'Escape' && productDetailsModal.classList.contains('open')){
		closeDetailsModal();
	}
});

productForm.addEventListener('submit', async (event) => {
	event.preventDefault();

	if(!RPAAuth.isAdmin()){
		return;
	}

	const imageInput = document.getElementById('productImage');
	const imageFile = imageInput.files?.[0];

	if(!imageFile && !editingProductId.value){
		alert('Selecione uma imagem para o produto.');
		return;
	}

	try{
		const imageUrl = imageFile ? await readFileAsDataUrl(imageFile) : null;
		const products = getProducts();
		const productData = {
			name: document.getElementById('productName').value.trim(),
			price: formatPrice(document.getElementById('productPrice').value),
			shortDescription: document.getElementById('productShort').value.trim(),
			details: document.getElementById('productDetails').value.trim(),
			imageAlt: document.getElementById('productName').value.trim()
		};

		if(editingProductId.value){
			const updatedProducts = products.map((item) => item.id === editingProductId.value ? {
				...item,
				...productData,
				imageUrl: imageUrl || item.imageUrl
			} : item);
			saveProducts(updatedProducts);
		} else {
			products.unshift({
				id: RPADb.createId('product'),
				...productData,
				imageUrl
			});
			saveProducts(products);
		}

		renderProducts();
		closeModal();
		RPAAuth.refresh();
	}catch(error){
		alert(error.message || 'Falha ao salvar o produto.');
	}
});

productsGrid.addEventListener('click', (event) => {
	const editButton = event.target.closest('[data-edit-id]');
	if(editButton){
		const productId = editButton.getAttribute('data-edit-id');
		const product = getProducts().find((item) => item.id === productId);
		if(!product){
			return;
		}

		editingProductId.value = product.id;
		document.getElementById('productName').value = product.name || '';
		document.getElementById('productPrice').value = product.price || '';
		document.getElementById('productShort').value = product.shortDescription || '';
		document.getElementById('productDetails').value = product.details || '';
		productSubmitBtn.textContent = 'Salvar alterações';
		productModal.classList.add('open');
		productModal.setAttribute('aria-hidden', 'false');
		return;
	}

	const removeButton = event.target.closest('[data-remove-id]');
	if(!removeButton){
		return;
	}

	const productId = removeButton.getAttribute('data-remove-id');
	const products = getProducts();
	const product = products.find((item) => item.id === productId);

	if(!product){
		return;
	}

	const shouldRemove = confirm(`Remover o produto "${product.name}"?`);
	if(!shouldRemove){
		return;
	}

	const filteredProducts = products.filter((item) => item.id !== productId);
	saveProducts(filteredProducts);
	renderProducts();
	RPAAuth.refresh();
});

productsGrid.addEventListener('click', (event) => {
	const productCard = event.target.closest('.produto[data-product-id]');
	if(!productCard){
		return;
	}

	const editButton = event.target.closest('[data-edit-id]');
	const removeButton = event.target.closest('[data-remove-id]');
	if(editButton || removeButton){
		return;
	}

	const productId = productCard.getAttribute('data-product-id');
	const product = getProducts().find((item) => item.id === productId);
	openDetailsModal(product);
});

closeProductDetailsModal.addEventListener('click', closeDetailsModal);
closeProductDetailsFooter.addEventListener('click', closeDetailsModal);

renderProducts();
RPAAuth.refresh();