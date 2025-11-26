document.addEventListener('DOMContentLoaded', () => {
    // ROUTAGE : On regarde quelle page est ouverte pour lancer la bonne fonction
    
    // Si on est sur la page catalogue (produits.html)
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    // Si on est sur la page panier (panier.html)
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
    // Si on est sur la page détail (produit.html)
    if (document.getElementById('product-detail-container')) {
        initProduitDetailPage();
    }
});

// =================================================================
// 1. LOGIQUE DE LA PAGE CATALOGUE (produits.html)
// =================================================================

/**
 * Fonction utilitaire pour mélanger un tableau (Algorithme de Fisher-Yates).
 * Permet d'afficher les produits dans un ordre aléatoire à chaque visite.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Affiche des rectangles gris (squelettes) pendant le chargement des produits.
 * Cela améliore l'expérience utilisateur visuelle.
 */
function displaySkeletonCards() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = ''; 

    // On affiche 8 fausses cartes
    for (let i = 0; i < 8; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'product-card skeleton';
        skeletonCard.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-text long"></div>
            <div class="skeleton-text short"></div>
        `;
        productList.appendChild(skeletonCard);
    }
}

/**
 * Fonction principale qui initialise la page Catalogue.
 * Charge les produits, applique le mélange aléatoire et gère les filtres.
 */
async function initProduitsPage() {
    const productList = document.getElementById('product-list');
    displaySkeletonCards(); // Affiche le chargement

    try {
        // Petit délai artificiel pour voir l'effet de chargement (optionnel)
        await new Promise(resolve => setTimeout(resolve, 500)); 

        // 1. Récupération des données depuis le fichier JSON
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Le fichier produits.json est introuvable.');
        
        const data = await response.json();
        // Gestion de la compatibilité : vérifie si les produits sont dans "items" ou à la racine
        const products = data.items ? data.items : data;
        
        // 2. MÉLANGE ALÉATOIRE : On mélange les produits dès leur arrivée
        shuffleArray(products);

        // 3. Configuration des filtres (Barre de recherche, Catégories, Tri)
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const sortBy = document.getElementById('sort-by');
        
        // Remplissage dynamique du menu déroulant des catégories
        const categories = [...new Set(products.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Vérification de l'URL pour voir si une catégorie est pré-demandée (ex: ?categorie=Sacs)
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) {
            categoryFilter.value = initialCategory;
        }

        /**
         * Fonction interne pour filtrer et trier les produits
         * Appelée à chaque fois que l'utilisateur touche aux filtres
         */
        function handleFilterAndSort() {
            productList.classList.add('is-loading'); // Petit effet de fondu
            
            setTimeout(() => {
                let filteredProducts = [...products];
                const category = categoryFilter.value;
                const searchTerm = searchInput.value.toLowerCase();
                const sortValue = sortBy.value;

                // A. Filtrage par catégorie
                if (category !== 'all') {
                    filteredProducts = filteredProducts.filter(p => p.categorie === category);
                }
                
                // B. Filtrage par recherche texte
                if (searchTerm) {
                    filteredProducts = filteredProducts.filter(p => p.nom.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm));
                }

                // C. Tri des produits
                switch (sortValue) {
                    case 'price-asc': filteredProducts.sort((a, b) => a.prix - b.prix); break;
                    case 'price-desc': filteredProducts.sort((a, b) => b.prix - a.prix); break;
                    case 'name-asc': filteredProducts.sort((a, b) => a.nom.localeCompare(b.nom)); break;
                    case 'name-desc': filteredProducts.sort((a, b) => b.nom.localeCompare(a.nom)); break;
                    // Si 'default', on ne fait rien, on garde l'ordre mélangé du début
                }
                
                displayProducts(filteredProducts);
                productList.classList.remove('is-loading');
            }, 300);
        }

        // Ajout des écouteurs d'événements sur les filtres
        categoryFilter.addEventListener('change', handleFilterAndSort);
        searchInput.addEventListener('input', handleFilterAndSort);
        sortBy.addEventListener('change', handleFilterAndSort);
        
        // 4. Premier affichage au chargement de la page
        function initialLoad() {
            let filteredProducts = [...products];
            const initialCategoryValue = categoryFilter.value;
             if (initialCategoryValue !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.categorie === initialCategoryValue);
            }
            displayProducts(filteredProducts);
        }
        initialLoad();

    } catch (error) {
        console.error("Erreur critique:", error);
        if(productList) productList.innerHTML = `<p class="error-message">Impossible de charger le catalogue.</p>`;
    }
}

/**
 * Génère le HTML pour chaque produit et l'injecte dans la grille.
 * Gère aussi l'affichage des badges (Épuisé, Like).
 */
function displayProducts(products) {
    const productList = document.getElementById('product-list');
    const likes = JSON.parse(localStorage.getItem('likes')) || {};
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = `<p class="empty-grid-message">Aucun produit ne correspond à votre recherche.</p>`;
        return;
    }

    products.forEach(product => {
        const isLiked = likes[product.id] || false;
        const likeCount = isLiked ? 1 : 0;
        const isOutOfStock = product.stock === 0;

        const productCard = document.createElement('div');
        productCard.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;

        const cartButtonHTML = isOutOfStock
            ? `<button class="btn out-of-stock-btn" disabled>Épuisé</button>`
            : `<button class="btn add-to-cart">Ajouter au panier</button>`;
        
        productCard.innerHTML = `
            <a href="produit.html?id=${product.id}" class="product-link">
                <img src="${product.image}" alt="${product.nom}" loading="lazy">
                <h3>${product.nom}</h3>
            </a>
            <p class="product-price">${formatPrice(product.prix)}</p> 
            <div class="product-actions" data-id="${product.id}">
                ${cartButtonHTML}
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    ❤️ <span class="like-count">${likeCount}</span>
                </button>
            </div>
        `;
        productList.appendChild(productCard);
    });
    // Une fois le HTML créé, on active les boutons (Panier, Like)
    addEventListenersToCards(products);
}

/**
 * Ajoute les interactions sur les cartes produits (Clic bouton panier, Clic bouton coeur).
 */
function addEventListenersToCards(products) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        const productId = actions.dataset.id;
        
        // Gestion des Likes (Coeur)
        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                let likes = JSON.parse(localStorage.getItem('likes')) || {};
                likes[productId] = !likes[productId]; // On inverse l'état
                localStorage.setItem('likes', JSON.stringify(likes));
                likeBtn.classList.toggle('liked', likes[productId]);
                likeBtn.querySelector('.like-count').textContent = likes[productId] ? 1 : 0;
            });
        }

        // Gestion de l'ajout au panier
        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const productToAdd = products.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                    showToast(`${productToAdd.nom} ajouté au panier !`);
                    
                    // Petit effet visuel sur le bouton
                    const originalText = cartBtn.innerHTML;
                    cartBtn.innerHTML = 'Ajouté ✔';
                    cartBtn.disabled = true;
                    setTimeout(() => {
                        cartBtn.innerHTML = originalText;
                        cartBtn.disabled = false;
                    }, 2000);
                }
            });
        }
    });
}

// =================================================================
// 2. LOGIQUE POUR LES RECOMMANDATIONS (Partagé)
// =================================================================

/**
 * Affiche des produits similaires en bas de la page détail.
 * Exclut le produit qu'on est en train de regarder.
 */
function displayRecommendations(currentProduct, allProducts) {
    const recommendationsSection = document.getElementById('recommendations-section');
    const recommendationsGrid = document.getElementById('recommendations-grid');

    if (!recommendationsSection || !recommendationsGrid) return;

    // On cherche les produits de la même catégorie
    const recommendedProducts = allProducts.filter(product => 
        product.categorie === currentProduct.categorie && product.id !== currentProduct.id
    );

    if (recommendedProducts.length === 0) {
        recommendationsSection.style.display = 'none';
        return;
    }

    // On en prend 4 au hasard
    const shuffledRecommendations = recommendedProducts.sort(() => 0.5 - Math.random()).slice(0, 4);
    recommendationsGrid.innerHTML = '';

    shuffledRecommendations.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="produit.html?id=${product.id}" class="product-link">
                <img src="${product.image}" alt="${product.nom}" loading="lazy">
                <h3>${product.nom}</h3>
            </a>
            <p class="product-price">${formatPrice(product.prix)}</p>
        `;
        recommendationsGrid.appendChild(productCard);
    });

    recommendationsSection.style.display = 'block';
}

// =================================================================
// 3. LOGIQUE DE LA PAGE DÉTAIL (produit.html)
// =================================================================

/**
 * Initialise la page d'un produit unique.
 * Récupère l'ID dans l'URL, cherche le produit, et affiche ses infos.
 */
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
        
        const data = await response.json();
        const allProducts = data.items ? data.items : data;
        
        const product = allProducts.find(p => p.id == productId);

        if (!product) { 
            container.innerHTML = "<p class='error-message'>Produit non trouvé.</p>"; 
            return; 
        }

        // Optimisation SEO : on change le titre de la page navigateur
        document.title = `${product.nom} - Sandy'Shop`;
        
        // Gestion du stock
        const isOutOfStock = product.stock === 0;
        const cartButtonHTML = isOutOfStock
            ? `<button class="btn out-of-stock-btn" disabled>Épuisé</button>`
            : `<button class="btn add-to-cart-detail">Ajouter au panier</button>`;

        // Gestion de la galerie d'images
        const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
        
        // Création du HTML de la page détail
        container.innerHTML = `
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-image"><img src="${product.image}" alt="${product.nom}" id="main-product-image"></div>
                    <div class="thumbnail-images">
                        <!-- Génère les petites images si galerie présente -->
                        ${productImages.map((img, index) => `<img src="${img}" alt="Vue ${index + 1}" class="${index === 0 ? 'active' : ''}">`).join('')}
                    </div>
                </div>
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    <p class="product-price">${formatPrice(product.prix)}</p>
                    <div class="product-options">
                        <label for="product-quantity">Quantité :</label>
                        <input type="number" id="product-quantity" value="1" min="1" max="${product.stock || 99}" style="width: 60px; padding: 0.5rem; text-align: center; border-radius: 5px; border: 1px solid var(--input-border-color);" ${isOutOfStock ? 'disabled' : ''}>
                    </div>
                    <p class="product-description">${product.description}</p>
                    ${cartButtonHTML}
                </div>
            </div>
        `;

        // Interaction Galerie : Changer l'image principale au clic sur une vignette
        const mainImage = document.getElementById('main-product-image');
        const thumbnails = container.querySelectorAll('.thumbnail-images img');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
        
        // Interaction Panier
        if (!isOutOfStock) {
            const addToCartBtn = container.querySelector('.add-to-cart-detail');
            const quantityInput = container.querySelector('#product-quantity');
            addToCartBtn.addEventListener('click', () => {
                const quantity = parseInt(quantityInput.value) || 1;
                addToCart(product, quantity);
                showToast(`${quantity} ${product.nom} ajouté(s) au panier !`);
                
                const originalText = addToCartBtn.innerHTML;
                addToCartBtn.innerHTML = 'Ajouté ✔';
                addToCartBtn.disabled = true;
                setTimeout(() => {
                    addToCartBtn.innerHTML = originalText;
                    addToCartBtn.disabled = false;
                }, 2000);
            });
        }

        displayRecommendations(product, allProducts);

    } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
        container.innerHTML = `<p class="error-message">Erreur lors du chargement du produit.</p>`;
    }
}

// =================================================================
// 4. LOGIQUE DE LA PAGE PANIER (panier.html)
// =================================================================

/**
 * Initialise le panier.
 * Affiche le tableau des articles, calcule le total, et gère le formulaire de commande.
 */
async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    const orderSection = document.getElementById('order-section');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const cartHeader = document.querySelector('.cart-header');
    
    // Champs cachés pour envoyer les infos à Formspree
    const cartContentInput = document.getElementById('cart-content');
    const cartTotalInput = document.getElementById('cart-total');

    if (!cartContainer || !orderSection) return;

    // Fonction interne pour redessiner le panier (après suppression ou changement qté)
    const renderCart = () => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (cart.length === 0) {
            cartHeader.style.display = 'none';
            orderSection.style.display = 'none';
            cartContainer.innerHTML = '<p class="empty-grid-message">Votre panier est vide.</p>';
            return;
        }

        cartHeader.style.display = 'flex';
        orderSection.style.display = 'block';

        let cartHTML = `
            <table class="cart-items">
                <thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th><th>Actions</th></tr></thead>
                <tbody>
        `;
        let totalGlobal = 0;
        let cartTextSummary = ""; // Texte formaté pour l'email

        cart.forEach(item => {
            const totalLigne = item.prix * item.quantity;
            totalGlobal += totalLigne;
            
            cartHTML += `
                <tr>
                    <td data-label="Produit">${item.nom}</td>
                    <td data-label="Prix">${formatPrice(item.prix)}</td>
                    <td data-label="Quantité"><input type="number" class="cart-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99"></td>
                    <td data-label="Total">${formatPrice(totalLigne)}</td>
                    <td data-label="Actions"><button class="btn-secondary remove-from-cart-btn" data-id="${item.id}">Supprimer</button></td>
                </tr>
            `;
            
            // Formatage texte pour l'email du vendeur
            cartTextSummary += `• ${item.nom} (x${item.quantity}) : ${formatPrice(totalLigne)}\n`;
        });

        cartHTML += `</tbody></table><div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>`;
        
        cartTextSummary += `\n-----------------------------\nTOTAL À PAYER : ${formatPrice(totalGlobal)}`;

        cartContainer.innerHTML = cartHTML;
        
        // Mise à jour des champs cachés du formulaire
        if(cartContentInput) cartContentInput.value = cartTextSummary;
        if(cartTotalInput) cartTotalInput.value = formatPrice(totalGlobal);

        // Écouteurs pour changement de quantité
        cartContainer.querySelectorAll('.cart-quantity-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const productId = e.target.dataset.id;
                const newQuantity = parseInt(e.target.value);
                if (newQuantity < 1 || isNaN(newQuantity)) {
                    // Si on met 0, on demande confirmation pour supprimer
                    const confirmed = await showCustomConfirm("Voulez-vous supprimer cet article du panier ?");
                    if (confirmed) {
                        removeFromCart(productId);
                        showToast("Article supprimé.");
                        renderCart();
                    } else {
                        // Annulation : on remet l'ancienne valeur
                        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
                        e.target.value = currentCart.find(item => item.id === productId)?.quantity || 1;
                    }
                } else {
                    updateCartItemQuantity(productId, newQuantity);
                    renderCart();
                }
            });
        });

        // Écouteurs pour bouton Supprimer
        cartContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                const confirmed = await showCustomConfirm("Voulez-vous vraiment supprimer cet article ?");
                if (confirmed) {
                    removeFromCart(productId);
                    showToast("Article supprimé du panier.");
                    renderCart();
                }
            });
        });
    };

    // Premier affichage du panier
    renderCart();

    // Bouton Vider le panier
    if(clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm("Voulez-vous vraiment vider votre panier ?");
            if (confirmed) {
                localStorage.removeItem('cart');
                showToast("Panier vidé !");
                renderCart();
            }
        });
    }

    // Gestion de la soumission du formulaire (Commande)
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // On bloque l'envoi classique pour gérer en AJAX
            
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.textContent = "Envoi en cours...";
            submitBtn.disabled = true;

            try {
                const formData = new FormData(orderForm);
                
                // Envoi des données à Formspree
                const response = await fetch(orderForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showToast('Commande validée avec succès !');
                    localStorage.removeItem('cart'); // On vide le panier après commande
                    
                    // Redirection vers l'accueil après 1.5 secondes
                    setTimeout(() => {
                        window.location.href = "index.html"; 
                    }, 1500);
                } else {
                    throw new Error('Erreur Formspree');
                }
            } catch (error) {
                console.error("Erreur commande:", error);
                showToast("Erreur lors de l'envoi. Veuillez réessayer.");
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
}
