document.addEventListener('DOMContentLoaded', () => {
    // Détermine quelle fonction initialiser en fonction de la page actuelle
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
});

// ===============================================
// FONCTIONS UTILITAIRES COMMUNES
// ===============================================

/**
 * Formate un nombre en chaîne de caractères monétaire FCFA.
 * Gère les cas où le prix n'est pas un nombre valide.
 * @param {number} price Le prix à formater.
 * @returns {string} Le prix formaté (ex: "59 000 FCFA").
 */
function formatPrice(price) {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
        console.error("Erreur: Un prix invalide a été détecté:", price);
        return 'Prix non disponible';
    }
    return priceNumber.toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Ajoute un produit au panier dans le localStorage.
 * @param {object} product L'objet produit à ajouter.
 */
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity++; // Incrémente la quantité si déjà présent
    } else {
        cart.push({ ...product, quantity: 1 }); // Ajoute le produit avec une quantité de 1
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ===============================================
// LOGIQUE SPÉCIFIQUE À LA PAGE PRODUITS
// ===============================================

/**
 * Initialise la page du catalogue de produits.
 */
async function initProduitsPage() {
    try {
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Le fichier produits.json est introuvable.');
        
        const products = await response.json();
        
        displayProducts(products); // Affiche tous les produits au chargement
        
        // Configuration des filtres et de la recherche
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

/**
 * Affiche une liste de produits dans la grille HTML.
 * @param {Array<object>} products La liste des produits à afficher.
 */
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
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.nom}">
            <h3>${product.nom}</h3>
            <p class="product-price">${formatPrice(product.prix)}</p>
            <div class="product-actions">
                <button class="btn add-to-cart">Ajouter au panier</button>
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    ❤️ <span class="like-count">${likeCount}</span>
                </button>
            </div>`;
        productList.appendChild(productCard);
    });
    addEventListenersToCards(products);
}

/**
 * Attache les écouteurs d'événements (like, ajout au panier) aux cartes de produits.
 * @param {Array<object>} products La liste des produits actuellement affichés.
 */
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

// ===============================================
// LOGIQUE SPÉCIFIQUE À LA PAGE PANIER (Version Formspree)
// ===============================================

/**
 * Initialise la page du panier.
 */
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
        // On cache le titre principal "Votre Panier" s'il existe et que le panier est vide
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
        // Vider le panier après la soumission du formulaire
        setTimeout(() => {
            localStorage.removeItem('cart');
        }, 500); // Délai pour s'assurer que le formulaire a eu le temps de s'envoyer
    });
}
