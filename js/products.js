document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
});

// ===============================================
// FONCTION `initPanierPage` CORRIGÉE ET SÉCURISÉE
// ===============================================
async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    const orderForm = document.getElementById('order-form');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const cartHeader = document.querySelector('.cart-header'); // Le titre et le bouton "Vider"

    // Vérifie si les éléments essentiels existent. Si non, on arrête pour éviter des erreurs.
    if (!cartContainer || !orderForm || !clearCartBtn || !cartHeader) {
        console.error("Un ou plusieurs éléments essentiels du panier sont manquants dans le HTML.");
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Gère l'affichage si le panier est vide
    if (cart.length === 0) {
        cartHeader.style.display = 'none'; // Cache le titre et le bouton "Vider"
        orderForm.style.display = 'none'; // Cache le formulaire
        cartContainer.innerHTML = '<h2>Votre Panier</h2><p>Votre panier est vide.</p>'; // Affiche le message
        return; // Stoppe la fonction ici
    }

    // Si on arrive ici, le panier n'est pas vide. On affiche tout.
    cartHeader.style.display = 'flex';
    orderForm.style.display = 'flex';

    // Active le bouton "Vider le panier"
    clearCartBtn.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment vider votre panier ?")) {
            localStorage.removeItem('cart');
            window.location.reload();
        }
    });

    // Affiche le contenu du panier
    let cartHTML = `<table class="cart-items"><thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th></tr></thead><tbody>`;
    let totalGlobal = 0;
    cart.forEach(item => {
        const totalLigne = item.prix * item.quantity;
        totalGlobal += totalLigne;
        cartHTML += `<tr><td>${item.nom}</td><td>${formatPrice(item.prix)}</td><td>${item.quantity}</td><td>${formatPrice(totalLigne)}</td></tr>`;
    });
    cartHTML += `</tbody></table><div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>`;
    cartContainer.innerHTML = cartHTML;

    // ==============================================================
    // Activation du bouton "Passer la commande"
    // L'écouteur est maintenant attaché sans risque d'être bloqué
    // ==============================================================
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche la page de se recharger
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const formMessage = document.getElementById('form-message');

        // IMPORTANT : VÉRIFIEZ QUE CETTE URL EST LA BONNE !
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzmAPcGGLRDMVbIjv6EWbHXJAR3k92NqLMiqaJ69u5cHLTdQApyewHJUvDJBKc9okw/exec"; 

        if (SCRIPT_URL === "https://script.google.com/macros/s/AKfycbzmAPcGGLRDMVbIjv6EWbHXJAR3k92NqLMiqaJ69u5cHLTdQApyewHJUvDJBKc9okw/exec" || !SCRIPT_URL.startsWith("https://script.google.com")) {
            formMessage.textContent = "Erreur : La fonctionnalité de commande n'est pas encore configurée.";
            formMessage.style.color = "red";
            return;
        }

        formMessage.textContent = "Envoi de la commande en cours...";
        formMessage.style.color = "grey";
        formMessage.scrollIntoView(); // Fait défiler jusqu'au message

        const orderData = {
            nom: name,
            email: email,
            panier: JSON.stringify(cart.map(p => ({ nom: p.nom, quantite: p.quantity, prix: p.prix }))),
            total: totalGlobal
        };

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                redirect: 'follow',
                body: JSON.stringify(orderData)
            });

            formMessage.textContent = "Commande envoyée avec succès ! Vous allez être redirigé.";
            formMessage.style.color = "green";
            localStorage.removeItem('cart');
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);

        } catch (error) {
            console.error('Order submission error:', error);
            formMessage.textContent = "Une erreur est survenue lors de l'envoi. Veuillez réessayer.";
            formMessage.style.color = "red";
        }
    });
}

// ===============================================
// NE PAS MODIFIER LES FONCTIONS CI-DESSOUS
// ===============================================

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
