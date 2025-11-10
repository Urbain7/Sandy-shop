document.addEventListener('DOMContentLoaded', () => {
    // Exécute le code spécifique à la page actuelle
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
});

// Gère l'initialisation de la page produits
async function initProduitsPage() {
    try {
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const products = await response.json();
        let likes = JSON.parse(localStorage.getItem('likes')) || {};

        displayProducts(products, likes);

        // Peuple le filtre des catégories
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const categories = [...new Set(products.map(p => p.categorie))];
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Ajoute les écouteurs pour filtrer et rechercher
        categoryFilter.addEventListener('change', () => filterAndSearch(products, likes));
        searchInput.addEventListener('input', () => filterAndSearch(products, likes));
    } catch (error) {
        console.error('Failed to initialize products page:', error);
    }
}

// Affiche les produits dans la grille
function displayProducts(products, likes) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.forEach(product => {
        const isLiked = likes[product.id] || false;
        const likeCount = isLiked ? 1 : 0;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        // MODIFICATION ICI: € -> FCFA et formatage du nombre
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.nom}">
            <h3>${product.nom}</h3>
            <p class="product-price">${product.prix.toLocaleString('fr-FR')} FCFA</p>
            <div class="product-actions">
                <button class="btn add-to-cart">Ajouter au panier</button>
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    ❤️ <span class="like-count">${likeCount}</span>
                </button>
            </div>
        `;
        productList.appendChild(productCard);
    });

    addEventListenersToCards();
}

// Filtre et recherche des produits
async function filterAndSearch() {
    try {
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const allProducts = await response.json();
        const likes = JSON.parse(localStorage.getItem('likes')) || {};

        const category = document.getElementById('category-filter').value;
        const searchTerm = document.getElementById('search-input').value.toLowerCase();

        let filteredProducts = allProducts;

        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.categorie === category);
        }

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => p.nom.toLowerCase().includes(searchTerm));
        }

        displayProducts(filteredProducts, likes);
    } catch (error) {
        console.error('Failed to filter products:', error);
    }
}

// Ajoute les écouteurs d'événements sur les boutons des cartes produits
function addEventListenersToCards() {
    // ... (le code pour les likes et l'ajout au panier reste le même)
    // Gestion des Likes
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const productId = card.dataset.id;
            
            let likes = JSON.parse(localStorage.getItem('likes')) || {};
            likes[productId] = !likes[productId]; // Bascule la valeur
            localStorage.setItem('likes', JSON.stringify(likes));
            
            const countSpan = btn.querySelector('.like-count');
            countSpan.textContent = likes[productId] ? 1 : 0;
            btn.classList.toggle('liked', likes[productId]);
        });
    });

    // Gestion de l'ajout au panier
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const card = e.target.closest('.product-card');
            const productId = parseInt(card.dataset.id, 10);
            
            const response = await fetch('data/produits.json');
            const allProducts = await response.json();
            const productToAdd = allProducts.find(p => p.id === productId);

            if (productToAdd) {
                addToCart(productToAdd);
                alert('Produit ajouté au panier !');
            }
        });
    });
}

// Ajoute un produit au panier dans le localStorage
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

// Gère l'initialisation de la page panier
async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    const orderForm = document.getElementById('order-form');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Votre panier est vide.</p>';
        if (orderForm) orderForm.style.display = 'none';
        return;
    }

    let cartHTML = `
        <table class="cart-items">
            <thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th></tr></thead>
            <tbody>
    `;

    let totalGlobal = 0;
    cart.forEach(item => {
        const totalLigne = item.prix * item.quantity;
        totalGlobal += totalLigne;
        // MODIFICATIONS ICI: € -> FCFA et formatage du nombre
        cartHTML += `
            <tr>
                <td>${item.nom}</td>
                <td>${item.prix.toLocaleString('fr-FR')} FCFA</td>
                <td>${item.quantity}</td>
                <td>${totalLigne.toLocaleString('fr-FR')} FCFA</td>
            </tr>
        `;
    });
    
    // MODIFICATION ICI: € -> FCFA et formatage du nombre
    cartHTML += `</tbody></table><div class="cart-total">Total : ${totalGlobal.toLocaleString('fr-FR')} FCFA</div>`;
    cartContainer.innerHTML = cartHTML;

    // ... (la suite du code pour le formulaire de commande reste la même)
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const formMessage = document.getElementById('form-message');

        const orderData = {
            nom: name,
            email: email,
            panier: JSON.stringify(cart.map(p => ({ nom: p.nom, quantite: p.quantity, prix: p.prix }))),
            total: totalGlobal
        };
        
        const SCRIPT_URL = "VOTRE_URL_APPS_SCRIPT"; 

        if (SCRIPT_URL === "VOTRE_URL_APPS_SCRIPT" || !SCRIPT_URL) {
            formMessage.textContent = "Erreur : La fonctionnalité de commande n'est pas encore configurée.";
            formMessage.style.color = "red";
            return;
        }

        try {
            formMessage.textContent = "Envoi de la commande en cours...";
            formMessage.style.color = "grey";
            
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                redirect: 'follow',
                body: JSON.stringify(orderData)
            });
            
            formMessage.textContent = "Commande envoyée avec succès ! Vous allez être redirigé.";
