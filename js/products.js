document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
});

// ... (toutes les fonctions de la page produits restent les mêmes) ...
// ... (formatPrice, initProduitsPage, displayProducts, etc.) ...
function formatPrice(price) { /* ... */ }
async function initProduitsPage() { /* ... */ }
function displayProducts(products) { /* ... */ }
function addEventListenersToCards(products) { /* ... */ }
function addToCart(product) { /* ... */ }


// ===============================================
// MISE À JOUR DE LA PAGE PANIER
// ===============================================
async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    const orderForm = document.getElementById('order-form');
    const clearCartBtn = document.getElementById('clear-cart-btn'); // On récupère le bouton
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Si le panier est vide
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Votre panier est vide.</p>';
        if (orderForm) orderForm.style.display = 'none';
        if (clearCartBtn) clearCartBtn.style.display = 'none'; // On cache le bouton "Vider"
        return;
    }

    // Si le panier n'est pas vide, on affiche le bouton "Vider"
    if (clearCartBtn) clearCartBtn.style.display = 'block';

    // Logique pour vider le panier
    clearCartBtn.addEventListener('click', () => {
        // On demande confirmation à l'utilisateur
        if (confirm("Voulez-vous vraiment vider votre panier ?")) {
            localStorage.removeItem('cart'); // Supprime le panier
            window.location.reload(); // Recharge la page pour afficher le panier vide
        }
    });

    // ... (la suite de la fonction pour afficher le contenu du panier reste la même) ...
    let cartHTML = `
        <table class="cart-items">
            <thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th></tr></thead>
            <tbody>
    `;
    let totalGlobal = 0;
    cart.forEach(item => {
        const totalLigne = item.prix * item.quantity;
        totalGlobal += totalLigne;
        cartHTML += `
            <tr>
                <td>${item.nom}</td>
                <td>${formatPrice(item.prix)}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(totalLigne)}</td>
            </tr>
        `;
    });
    
    cartHTML += `</tbody></table><div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>`;
    cartContainer.innerHTML = cartHTML;

    // Affiche le formulaire de commande
    if (orderForm) orderForm.style.display = 'flex';

    // Logique d'envoi du formulaire (inchangée)
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // ... Logique d'envoi vers Google Sheets ...
    });
}

// NOTE : Pour la clarté, je remets ici les fonctions que j'ai abrégées plus haut.
// Assurez-vous que votre fichier final les contienne.

function formatPrice(price) {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
        console.error("Erreur: Un prix invalide a été détecté:", price);
        return 'Prix non disponible';
    }
    return priceNumber.toLocaleString('fr-FR') + ' FCFA';
}

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
        productList.innerHTML = `<p style="color: red; text-align: center;">Impossible de charger le catalogue. Veuillez réessayer plus tard.</p>`;
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
        productCard.dataset.id = product.id;
        productCard.innerHTML = `<img src="${product.image}" alt="${product.nom}"><h3>${product.nom}</h3><p class="product-price">${formatPrice(product.prix)}</p><div class="product-actions"><button class="btn add-to-cart">Ajouter au panier</button><button class="like-btn ${isLiked ? 'liked' : ''}">❤️ <span class="like-count">${likeCount}</span></button></div>`;
        productList.appendChild(productCard);
    });
    addEventListenersToCards(products);
}

function addEventListenersToCards(products) {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const productId = card.dataset.id;
            let likes = JSON.parse(localStorage.getItem('likes')) || {};
            likes[productId] = !likes[productId];
            localStorage.setItem('likes', JSON.stringify(likes));
            btn.classList.toggle('liked', likes[productId]);
            btn.querySelector('.like-count').textContent = likes[productId] ? 1 : 0;
        });
    });
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const productId = parseInt(card.dataset.id, 10);
            const productToAdd = products.find(p => p.id === productId);
            if (productToAdd) {
                addToCart(productToAdd);
                alert('Produit ajouté au panier !');
            }
        });
    });
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}
