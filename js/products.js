document.addEventListener('DOMContentLoaded', () => {
    // Exécute le code spécifique à la page actuelle
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
});

// =================================================================
// CORRECTION PRINCIPALE : Fonction de formatage de prix sécurisée
// =================================================================
// Cette fonction empêche le site de planter si un prix est manquant ou incorrect dans produits.json
function formatPrice(price) {
    const priceNumber = Number(price); // Tente de convertir le prix en nombre
    // Si la conversion échoue (le prix n'est pas un nombre), on retourne une valeur par défaut
    if (isNaN(priceNumber)) {
        console.error("Erreur: Un prix invalide a été détecté:", price);
        return 'Prix non disponible';
    }
    // Si c'est un nombre valide, on le formate en FCFA
    return priceNumber.toLocaleString('fr-FR') + ' FCFA';
}

// Gère l'initialisation de la page produits
async function initProduitsPage() {
    try {
        // =================================================================
        // OPTIMISATION 1 : On ne charge les produits qu'UNE SEULE FOIS
        // =================================================================
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Le fichier produits.json est introuvable.');
        
        const products = await response.json(); // La liste complète des produits
        
        // On affiche tous les produits au démarrage
        displayProducts(products);

        // Peuple le filtre des catégories
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const categories = [...new Set(products.map(p => p.categorie))];
        
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'; // Réinitialise les options
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // =================================================================
        // CORRECTION 2 : Logique de filtrage simplifiée et corrigée
        // =================================================================
        // Cette fonction s'exécute à chaque changement de filtre ou de recherche
        function handleFilterAndSearch() {
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            
            // On travaille sur la liste de produits déjà chargée, sans la re-télécharger
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
        // Affiche un message d'erreur clair sur la page pour l'utilisateur
        productList.innerHTML = `<p style="color: red; text-align: center;">Impossible de charger le catalogue. Veuillez réessayer plus tard.</p>`;
    }
}

// Affiche les produits dans la grille
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
        
        // On utilise la nouvelle fonction sécurisée formatPrice()
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.nom}">
            <h3>${product.nom}</h3>
            <p class="product-price">${formatPrice(product.prix)}</p>
            <div class="product-actions">
                <button class="btn add-to-cart">Ajouter au panier</button>
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    ❤️ <span class="like-count">${likeCount}</span>
                </button>
            </div>
        `;
        productList.appendChild(productCard);
    });

    addEventListenersToCards(products);
}

// Ajoute les écouteurs d'événements sur les boutons des cartes produits
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
            // =================================================================
            // OPTIMISATION 3 : Pas besoin de re-télécharger pour ajouter au panier
            // =================================================================
            const productToAdd = products.find(p => p.id === productId);
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
    // ... Le code de la page panier est principalement le même, mais utilise aussi formatPrice() ...
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

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // ... Logique d'envoi du formulaire inchangée ...
    });
}
