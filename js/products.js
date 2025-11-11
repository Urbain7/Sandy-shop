document.addEventListener('DOMContentLoaded', () => {
    // Détermine quelle fonction initialiser en fonction de la page actuelle
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
    if (document.getElementById('product-detail-container')) {
        initProduitDetailPage();
    }
});

// ===============================================
// FONCTIONS UTILITAIRES COMMUNES
// ===============================================
function formatPrice(price) {const priceNumber = Number(price); if (isNaN(priceNumber)) {console.error("Erreur: Un prix invalide a été détecté:", price); return 'Prix non disponible';} return priceNumber.toLocaleString('fr-FR') + ' FCFA';}
function addToCart(product) {let cart = JSON.parse(localStorage.getItem('cart')) || []; let existingProduct = cart.find(item => item.id === product.id); if (existingProduct) {existingProduct.quantity++;} else {cart.push({ ...product, quantity: 1 });} localStorage.setItem('cart', JSON.stringify(cart));}

// ===============================================
// LOGIQUE SPÉCIFIQUE À LA PAGE CATALOGUE
// ===============================================
async function initProduitsPage() {
    try {
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Le fichier produits.json est introuvable.');
        const products = await response.json();
        
        displayProducts(products);
        
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const categories = [...new Set(products.map(p => p.categorie))];
        
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        function handleFilterAndSearch() {
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            let filteredProducts = products;
            if (category !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.categorie === category);
            }
            if (searchTerm) {
                filteredProducts = filteredProducts.filter(p => p.nom.toLowerCase().includes(searchTerm));
            }
            displayProducts(filteredProducts);
        }
        categoryFilter.addEventListener('change', handleFilterAndSearch);
        searchInput.addEventListener('input', handleFilterAndSearch);
    } catch (error) {
        console.error("Erreur critique lors du chargement des produits:", error);
        const productList = document.getElementById('product-list');
        if(productList) productList.innerHTML = `<p style="color: red; text-align: center;">Impossible de charger le catalogue. Veuillez réessayer plus tard.</p>`;
    }
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    const likes = JSON.parse(localStorage.getItem('likes')) || {};
    productList.innerHTML = '';
    if (products.length === 0) {
        productList.innerHTML = `<p style="text-align: center;">Aucun produit ne correspond à votre recherche.</p>`;
        return;
    }
    products.forEach(product => {
        const isLiked = likes[product.id] || false;
        const likeCount = isLiked ? 1 : 0;
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        // Le lien entoure l'image et le titre
        productCard.innerHTML = `
            <a href="produit.html?id=${product.id}" class="product-link">
                <img src="${product.image}" alt="${product.nom}">
                <h3>${product.nom}</h3>
            </a>
            <p class="product-price">${formatPrice(product.prix)}</p>
            <div class="product-actions" data-id="${product.id}">
                <button class="btn add-to-cart">Ajouter au panier</button>
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    ❤️ <span class="like-count">${likeCount}</span>
                </button>
            </div>`;
        productList.appendChild(productCard);
    });
    // On appelle la fonction pour attacher les événements après avoir créé les cartes
    addEventListenersToCards(products);
}

// CORRECTION MAJEURE : La logique pour attacher les événements est restaurée et fonctionnelle
function addEventListenersToCards(products) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        const productId = actions.dataset.id;
        
        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                let likes = JSON.parse(localStorage.getItem('likes')) || {};
                likes[productId] = !likes[productId];
                localStorage.setItem('likes', JSON.stringify(likes));
                likeBtn.classList.toggle('liked', likes[productId]);
                likeBtn.querySelector('.like-count').textContent = likes[productId] ? 1 : 0;
            });
        }

        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                // On cherche le produit dans la liste complète
                const productToAdd = products.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                    alert('Produit ajouté au panier !');
                }
            });
        }
    });
}


// ===============================================
// LOGIQUE SPÉCIFIQUE À LA PAGE DÉTAIL
// ===============================================
async function initProduitDetailPage() {
    const container = document.getElementById('product-detail-container');
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) { container.innerHTML = "<p>Produit non trouvé.</p>"; return; }

    try {
        const response = await fetch('data/produits.json');
        if(!response.ok) throw new Error("Could not fetch product data.");
        const products = await response.json();
        const product = products.find(p => p.id == productId);

        if (!product) { container.innerHTML = "<p>Produit non trouvé.</p>"; return; }

        document.title = `${product.nom} - Sandy'Shop`;
        container.innerHTML = `
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-image"><img src="${product.image}" alt="${product.nom}" id="main-product-image"></div>
                    <div class="thumbnail-images">${product.images.map((img, index) => `<img src="${img}" alt="Vue ${index + 1}" class="${index === 0 ? 'active' : ''}">`).join('')}</div>
                </div>
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    <p class="product-price">${formatPrice(product.prix)}</p>
                    <p class="product-description">${product.description}</p>
                    <button class="btn add-to-cart-detail">Ajouter au panier</button>
                </div>
            </div>`;

        const mainImage = document.getElementById('main-product-image');
        const thumbnails = container.querySelectorAll('.thumbnail-images img');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        const addToCartBtn = container.querySelector('.add-to-cart-detail');
        addToCartBtn.addEventListener('click', () => {
            addToCart(product);
            alert(`${product.nom} a été ajouté au panier !`);
        });
    } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
        container.innerHTML = "<p>Erreur lors du chargement du produit.</p>";
    }
}


// ===============================================
// LOGIQUE SPÉCIFIQUE À LA PAGE PANIER
// ===============================================
async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    const orderSection = document.getElementById('order-section');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const cartHeader = document.querySelector('.cart-header');
    
    const cartContentInput = document.getElementById('cart-content');
    const cartTotalInput = document.getElementById('cart-total');

    if (!cartContainer || !orderSection || !clearCartBtn || !cartHeader || !cartContentInput || !cartTotalInput) {
        console.error("Un ou plusieurs éléments HTML essentiels du panier sont manquants.");
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        if(cartHeader) cartHeader.style.display = 'none';
        if(orderSection) orderSection.style.display = 'none';
        cartContainer.innerHTML = '<p style="text-align: center; padding: 2rem 0;">Votre panier est vide.</p>';
        const mainTitle = document.querySelector('.cart-header h2');
        if(mainTitle) mainTitle.style.display = 'none';
        return;
    }

    cartHeader.style.display = 'flex';
    orderSection.style.display = 'block';

    clearCartBtn.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment vider votre panier ?")) {
            localStorage.removeItem('cart');
            window.location.reload();
        }
    });

    let cartHTML = `<table class="cart-items"><thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th></tr></thead><tbody>`;
    let totalGlobal = 0;
    let cartTextSummary = "";

    cart.forEach(item => {
        const totalLigne = item.prix * item.quantity;
        totalGlobal += totalLigne;
        cartHTML += `<tr><td>${item.nom}</td><td>${formatPrice(item.prix)}</td><td>${item.quantity}</td><td>${formatPrice(totalLigne)}</td></tr>`;
        cartTextSummary += `${item.nom} (Quantité: ${item.quantity}) - Total: ${formatPrice(totalLigne)}\n`;
    });

    cartHTML += `</tbody></table><div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>`;
    cartContainer.innerHTML = cartHTML;
    
    cartContentInput.value = cartTextSummary;
    cartTotalInput.value = formatPrice(totalGlobal);

    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', () => {
        setTimeout(() => {
            localStorage.removeItem('cart');
        }, 500);
    });
}
