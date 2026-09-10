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
	return RPAApi.getProducts();
}



function getWhatsAppLink(productName){
	const contacts = RPAApi.getContacts();
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

function formatPrice(value){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value)); }
function openModal(){
	if(!RPAAuth.isAdmin()){
		return;
	}

	productForm.reset();
	editingProductId.value = '';
	document.getElementById('productImage').required = true;
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
				<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.imageAlt || product.name)}">
			</div>
			<div class="info">
				<h3>${escapeHtml(product.name)}</h3>
				<p class="preco">${escapeHtml(formatPrice(product.price))}</p>
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
        const payload = new FormData();
        payload.set('id', editingProductId.value);
        for (const [key,id] of Object.entries({name:'productName',price:'productPrice',shortDescription:'productShort',details:'productDetails',imageAlt:'productName'})) payload.set(key,document.getElementById(id).value.trim());
        if(imageFile) payload.set('image',imageFile);
        await RPAApi.save('products/save',payload);

		renderProducts();
		closeModal();
		RPAAuth.refresh();
	}catch(error){
		alert(error.message || 'Falha ao salvar o produto.');
	}
});

productsGrid.addEventListener('click', async (event) => {
	const editButton = event.target.closest('[data-edit-id]');
	if(editButton){
		const productId = editButton.getAttribute('data-edit-id');
		const product = getProducts().find((item) => item.id === productId);
		if(!product){
			return;
		}

		editingProductId.value = product.id;
		document.getElementById('productImage').value = '';
		document.getElementById('productImage').required = false;
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

	try { await RPAApi.save('products/delete',{id:productId}); } catch(error) { alert(error.message); return; }
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

Promise.all([RPAApi.ready,RPAAuth.ready]).then(renderProducts).catch(RPAApi.showError);
