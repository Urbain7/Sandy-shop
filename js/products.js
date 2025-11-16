document.addEventListener('DOMContentLoaded', () => {
    // Exécution de la fonction d'initialisation appropriée
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
// LOGIQUE SPÉCIFIQUE À LA PAGE CATALOGUE
// ===============================================

async function initProduitsPage() {
    try {
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Le fichier produits.json est introuvable.');
        const products = await response.json();
        
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        
        // Populate category filter
        const categories = [...new Set(products.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Read category from URL if present (from homepage category links)
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) {
            categoryFilter.value = initialCategory;
        }

        function handleFilterAndSearch() {
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            let filteredProducts = products;

            if (category !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.categorie === category);
            }
            if (searchTerm) {
                filteredProducts = filteredProducts.filter(p => 
                    p.nom.toLowerCase().includes(searchTerm) || 
                    p.description.toLowerCase().includes(searchTerm) ||
                    p.categorie.toLowerCase().includes(searchTerm)
                );
            }
            displayProducts(filteredProducts);
        }

        categoryFilter.addEventListener('change', handleFilterAndSearch);
        searchInput.addEventListener('input', handleFilterAndSearch);

        // Initial display of products (with potential category filter from URL)
        handleFilterAndSearch();

    } catch (error) {
        console.error("Erreur critique lors du chargement des produits:", error);
        const productList = document.getElementById('product-list');
        if(productList) productList.innerHTML = `<p class="error-message">Impossible de charger le catalogue. Veuillez réessayer plus tard.</p>`;
    }
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    const likes = JSON.parse(localStorage.getItem('likes')) || {};
    productList.innerHTML = ''; // Clear previous products

    if (products.length === 0) {
        productList.innerHTML = `<p style="text-align: center; padding: 2rem 0;">Aucun produit ne correspond à votre recherche.</p>`;
        return;
    }

    products.forEach(product => {
        const isLiked = likes[product.id] || false;
        // Pour les likes, tu peux utiliser une icône SVG si tu veux :
        // const heartIcon = isLiked ? '<svg ... filled heart ...>' : '<svg ... empty heart ...>';
        // Ou simplement le texte pour le moment.
        const likeCount = isLiked ? 1 : 0; // Simple compteur pour l'exemple

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="produit.html?id=${product.id}" class="product-link">
                <img src="${product.image}" alt="${product.nom}">
                <h3>${product.nom}</h3>
            </a>
            <p class="product-price">${formatPrice(product.prix)}</p>
            <div class="product-actions" data-id="${product.id}">
                <button class="btn add-to-cart">Ajouter au panier</button>
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    <!-- Remplacer par une icône SVG de coeur pour un meilleur rendu -->
                    ❤️ <span class="like-count">${likeCount}</span>
                </button>
            </div>
        `;
        productList.appendChild(productCard);
    });
    addEventListenersToCards(products);
}

function addEventListenersToCards(products) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        const productId = actions.dataset.id;
        
        // Like Button
        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                let likes = JSON.parse(localStorage.getItem('likes')) || {};
                likes[productId] = !likes[productId]; // Toggle like status
                localStorage.setItem('likes', JSON.stringify(likes));
                likeBtn.classList.toggle('liked', likes[productId]);
                likeBtn.querySelector('.like-count').textContent = likes[productId] ? 1 : 0; // Update count
            });
        }

        // Add to Cart Button
        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const productToAdd = products.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd); // Utilise la fonction de utils.js
                    showToast(`${productToAdd.nom} ajouté au panier !`);
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

    if (!productId) { 
        container.innerHTML = "<p class='error-message'>Produit non trouvé.</p>"; 
        return; 
    }

    try {
        const response = await fetch('data/produits.json');
        if(!response.ok) throw new Error("Could not fetch product data.");
        const products = await response.json();
        const product = products.find(p => p.id == productId);

        if (!product) { 
            container.innerHTML = "<p class='error-message'>Produit non trouvé.</p>"; 
            return; 
        }

        document.title = `${product.nom} - Sandy'Shop`;

        // Assurer que product.images est un tableau et a au moins une image
        const productImages = product.images && product.images.length > 0 ? product.images : [product.image];

        container.innerHTML = `
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-image">
                        <img src="${productImages[0]}" alt="${product.nom}" id="main-product-image">
                    </div>
                    <div class="thumbnail-images">
                        ${productImages.map((img, index) => 
                            `<img src="${img}" alt="Vue ${index + 1}" class="${index === 0 ? 'active' : ''}">`
                        ).join('')}
                    </div>
                </div>
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    <p class="product-price">${formatPrice(product.prix)}</p>
                    <div class="product-options">
                        <!-- Ici, tu pourrais ajouter des options comme la taille, la couleur, etc. -->
                        <label for="product-quantity">Quantité:</label>
                        <input type="number" id="product-quantity" value="1" min="1" max="99" style="width: 60px; padding: 0.5rem; border: 1px solid var(--input-border-color); border-radius: 5px; text-align: center; margin-left: 0.5rem;">
                    </div>
                    <p class="product-description">${product.description}</p>
                    <button class="btn add-to-cart-detail">Ajouter au panier</button>
                </div>
            </div>
        `;

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
        const quantityInput = container.querySelector('#product-quantity');
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            addToCart(product, quantity); // Utilise la fonction de utils.js avec la quantité
            showToast(`${quantity} ${product.nom} ajouté(s) au panier !`);
        });

    } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
        container.innerHTML = `<p class="error-message">Erreur lors du chargement du produit.</p>`;
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

    // Vérifier la présence des éléments HTML essentiels
    if (!cartContainer || !orderSection || !clearCartBtn || !cartHeader || !cartContentInput || !cartTotalInput) {
        console.error("Un ou plusieurs éléments HTML essentiels du panier sont manquants. Assurez-vous d'avoir #cart-container, #order-section, #clear-cart-btn, .cart-header, #cart-content, #cart-total.");
        // Gérer l'affichage d'un message d'erreur utilisateur si nécessaire
        if (cartContainer) cartContainer.innerHTML = '<p class="error-message">Une erreur est survenue lors du chargement du panier.</p>';
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const renderCart = () => {
        cart = JSON.parse(localStorage.getItem('cart')) || []; // Recharger le panier après chaque modification

        if (cart.length === 0) {
            cartHeader.style.display = 'none';
            orderSection.style.display = 'none';
            cartContainer.innerHTML = '<p style="text-align: center; padding: 2rem 0;">Votre panier est vide.</p>';
            return;
        }

        cartHeader.style.display = 'flex';
        orderSection.style.display = 'block';

        let cartHTML = `
            <table class="cart-items">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Prix</th>
                        <th>Quantité</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let totalGlobal = 0;
        let cartTextSummary = ""; // Pour le formulaire de commande (sans backend)

        cart.forEach(item => {
            const totalLigne = item.prix * item.quantity;
            totalGlobal += totalLigne;
            cartHTML += `
                <tr>
                    <td>${item.nom}</td>
                    <td>${formatPrice(item.prix)}</td>
                    <td>
                        <input type="number" class="cart-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99" style="width: 70px; padding: 0.5rem; border: 1px solid var(--input-border-color); border-radius: 5px; text-align: center;">
                    </td>
                    <td>${formatPrice(totalLigne)}</td>
                    <td>
                        <button class="btn-secondary remove-from-cart-btn" data-id="${item.id}">Supprimer</button>
                    </td>
                </tr>
            `;
            cartTextSummary += `${item.nom} (Quantité: ${item.quantity}) - Total: ${formatPrice(totalLigne)}\n`;
        });

        cartHTML += `
                </tbody>
            </table>
            <div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>
        `;
        cartContainer.innerHTML = cartHTML;

        // Mise à jour des champs cachés du formulaire
        cartContentInput.value = cartTextSummary;
        cartTotalInput.value = formatPrice(totalGlobal);

        // Ajout des EventListeners pour les boutons de quantité et suppression
        cartContainer.querySelectorAll('.cart-quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const productId = e.target.dataset.id;
                const newQuantity = parseInt(e.target.value);
                if (newQuantity < 1 || isNaN(newQuantity)) { // Si la quantité est invalide ou < 1, la supprimer
                    if (confirm("Voulez-vous supprimer cet article du panier ?")) {
                        removeFromCart(productId);
                        showToast("Article supprimé du panier.");
                    } else {
                        // Revenir à l'ancienne quantité si l'utilisateur annule
                        e.target.value = cart.find(item => item.id === productId)?.quantity || 1;
                        return;
                    }
                } else {
                    updateCartItemQuantity(productId, newQuantity);
                    showToast("Quantité mise à jour !");
                }
                renderCart(); // Re-rendre le panier après modification
            });
        });

        cartContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                if (confirm("Voulez-vous vraiment supprimer cet article du panier ?")) {
                    removeFromCart(productId);
                    showToast("Article supprimé du panier.");
                    renderCart(); // Re-rendre le panier après suppression
                }
            });
        });
    };

    // Initial render
    renderCart();

    // Event listener pour vider le panier
    clearCartBtn.addEventListener('click', () => {
        if (confirm("Voulez-vous vraiment vider votre panier ?")) {
            localStorage.removeItem('cart');
            showToast("Panier vidé !");
            renderCart(); // Re-rendre le panier (qui sera vide)
        }
    });

    // Gestion de la soumission du formulaire de commande (sans backend)
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Empêcher l'envoi réel du formulaire
            alert('Votre commande a été "passée" ! (Cette fonction est côté client uniquement)');
            localStorage.removeItem('cart');
            showToast("Commande confirmée et panier vidé !");
            renderCart();
            // Tu peux rediriger l'utilisateur vers une page de confirmation ici si tu veux
            // window.location.href = 'confirmation.html';
        });
    } else {
        console.warn("Le formulaire de commande (#order-form) est introuvable. La soumission de commande ne sera pas gérée.");
    }
}
