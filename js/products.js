document.addEventListener('DOMContentLoaded', () => {
    // ROUTAGE : On détecte sur quelle page on est pour lancer la bonne fonction
    
    // Page Catalogue (produits.html)
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    // Page Panier (panier.html)
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
    // Page Détail (produit.html)
    if (document.getElementById('product-detail-container')) {
        initProduitDetailPage();
    }
});

// =================================================================
// 1. UTILITAIRES & LOGIQUE CATALOGUE
// =================================================================

/**
 * Mélange un tableau de façon aléatoire (Algorithme Fisher-Yates).
 * Permet de ne pas toujours afficher les mêmes produits en premier.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Affiche les blocs gris de chargement (Skeletons).
 */
function displaySkeletonCards() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = ''; 

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
 * Initialisation de la page Catalogue.
 */
async function initProduitsPage() {
    const productList = document.getElementById('product-list');
    displaySkeletonCards();

    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Petit délai esthétique

        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Le fichier produits.json est introuvable.');
        
        const data = await response.json();
        // Compatibilité : vérifie si les produits sont dans "items" ou à la racine
        const products = data.items ? data.items : data;
        
        // --- MÉLANGE ALÉATOIRE ---
        // On mélange les produits dès le chargement pour la découverte
        shuffleArray(products);

        // Configuration des filtres
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const sortBy = document.getElementById('sort-by');
        
        // Remplissage du menu déroulant catégories
        const categories = [...new Set(products.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Gestion de la présélection via URL (?categorie=Sacs)
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) {
            categoryFilter.value = initialCategory;
        }

        // Fonction de tri et filtrage
        function handleFilterAndSort() {
            productList.classList.add('is-loading');
            
            setTimeout(() => {
                let filteredProducts = [...products];
                const category = categoryFilter.value;
                const searchTerm = searchInput.value.toLowerCase();
                const sortValue = sortBy.value;

                // 1. Filtrer par catégorie
                if (category !== 'all') {
                    filteredProducts = filteredProducts.filter(p => p.categorie === category);
                }
                
                // 2. Filtrer par recherche
                if (searchTerm) {
                    filteredProducts = filteredProducts.filter(p => p.nom.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm));
                }

                // 3. Trier
                switch (sortValue) {
                    case 'price-asc': filteredProducts.sort((a, b) => a.prix - b.prix); break;
                    case 'price-desc': filteredProducts.sort((a, b) => b.prix - a.prix); break;
                    case 'name-asc': filteredProducts.sort((a, b) => a.nom.localeCompare(b.nom)); break;
                    case 'name-desc': filteredProducts.sort((a, b) => b.nom.localeCompare(a.nom)); break;
                    // Si 'default', on garde l'ordre mélangé initial
                }
                
                displayProducts(filteredProducts);
                productList.classList.remove('is-loading');
            }, 300);
        }

        categoryFilter.addEventListener('change', handleFilterAndSort);
        searchInput.addEventListener('input', handleFilterAndSort);
        sortBy.addEventListener('change', handleFilterAndSort);
        
        // Premier chargement
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
 * Affiche les cartes produits dans la grille.
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
    addEventListenersToCards(products);
}

function addEventListenersToCards(products) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        const productId = actions.dataset.id;
        
        // Like
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

        // Panier
        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const productToAdd = products.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                    showToast(`${productToAdd.nom} ajouté au panier !`);
                    
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
// 2. LOGIQUE RECOMMANDATIONS
// =================================================================

function displayRecommendations(currentProduct, allProducts) {
    const recommendationsSection = document.getElementById('recommendations-section');
    const recommendationsGrid = document.getElementById('recommendations-grid');

    if (!recommendationsSection || !recommendationsGrid) return;

    const recommendedProducts = allProducts.filter(product => 
        product.categorie === currentProduct.categorie && product.id !== currentProduct.id
    );

    if (recommendedProducts.length === 0) {
        recommendationsSection.style.display = 'none';
        return;
    }

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
// 3. LOGIQUE PAGE DÉTAIL (produit.html)
// =================================================================

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

        // SEO et Stock
        document.title = `${product.nom} - Sandy'Shop`;
        const isOutOfStock = product.stock === 0;
        const cartButtonHTML = isOutOfStock
            ? `<button class="btn out-of-stock-btn" disabled>Épuisé</button>`
            : `<button class="btn add-to-cart-detail">Ajouter au panier</button>`;

        // Gestion Galerie
        const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
        
        // --- RENDU HTML ---
        container.innerHTML = `
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-image"><img src="${product.image}" alt="${product.nom}" id="main-product-image"></div>
                    <div class="thumbnail-images">
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

        // --- NOUVEAU : BOUTONS WHATSAPP & PARTAGE ---
        const productInfoDiv = container.querySelector('.product-info');

        // 1. Bouton "Commander directement sur WhatsApp"
        if (!isOutOfStock) {
            // Message pré-rempli
            const waMessage = `Bonjour Sandy'Shop, je souhaite commander ce produit : ${product.nom} au prix de ${formatPrice(product.prix)}. Est-il disponible ?`;
            // Lien WhatsApp (Numéro + Message)
            const waLink = `https://wa.me/22893899538?text=${encodeURIComponent(waMessage)}`;
            
            // Création du bouton vert
            const btnWaHTML = `
                <a href="${waLink}" class="btn btn-whatsapp-order" target="_blank">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"/></svg>
                    Commander sur WhatsApp
                </a>
            `;
            // Insertion après la description, avant le bouton panier
            const descElement = productInfoDiv.querySelector('.product-description');
            descElement.insertAdjacentHTML('afterend', btnWaHTML);
        }
        // 2. Section de Partage (Natif Mobile)
        const shareSectionHTML = `
            <div class="share-section">
                <p>Ce produit pourrait plaire à une amie ?</p>
                <button id="native-share-btn" class="btn-secondary" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                    </svg>
                    Partager ce produit
                </button>
            </div>
        `;
        
        productInfoDiv.insertAdjacentHTML('beforeend', shareSectionHTML);

        // La logique intelligente du partage
        const shareBtn = document.getElementById('native-share-btn');
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: `Sandy'Shop - ${product.nom}`,
                text: `Regarde ce produit magnifique : ${product.nom} (${formatPrice(product.prix)})`,
                url: window.location.href
            };

            try {
                // On essaie de partager l'image si le navigateur le permet
                const response = await fetch(product.image);
                const blob = await response.blob();
                const file = new File([blob], "produit.jpg", { type: blob.type });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: shareData.title,
                        text: shareData.text,
                        url: shareData.url
                    });
                } else {
                    // Si on ne peut pas partager l'image (ordi), on partage juste le lien
                    await navigator.share(shareData);
                }
            } catch (err) {
                console.log("Partage impossible ou annulé", err);
                // Si tout échoue (vieux navigateur), on ouvre WhatsApp à l'ancienne
                window.open(`whatsapp://send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`);
            }
        });

        
        
        // Insertion en bas de la fiche
        productInfoDiv.insertAdjacentHTML('beforeend', shareHTML);
        // --- FIN NOUVEAU ---

        // Logique Galerie (changement image)
        const mainImage = document.getElementById('main-product-image');
        const thumbnails = container.querySelectorAll('.thumbnail-images img');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
        
        // Logique Bouton Ajouter au Panier (classique)
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
// 4. LOGIQUE PANIER (panier.html)
// =================================================================

async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    const orderSection = document.getElementById('order-section');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const cartHeader = document.querySelector('.cart-header');
    
    const cartContentInput = document.getElementById('cart-content');
    const cartTotalInput = document.getElementById('cart-total');

    if (!cartContainer || !orderSection) return;

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
        let cartTextSummary = "";

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
            cartTextSummary += `• ${item.nom} (x${item.quantity}) : ${formatPrice(totalLigne)}\n`;
        });

        cartHTML += `</tbody></table><div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>`;
        cartTextSummary += `\n-----------------------------\nTOTAL À PAYER : ${formatPrice(totalGlobal)}`;

        cartContainer.innerHTML = cartHTML;
        if(cartContentInput) cartContentInput.value = cartTextSummary;
        if(cartTotalInput) cartTotalInput.value = formatPrice(totalGlobal);

        // Events Quantité
        cartContainer.querySelectorAll('.cart-quantity-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const productId = e.target.dataset.id;
                const newQuantity = parseInt(e.target.value);
                if (newQuantity < 1 || isNaN(newQuantity)) {
                    const confirmed = await showCustomConfirm("Voulez-vous supprimer cet article du panier ?");
                    if (confirmed) {
                        removeFromCart(productId);
                        showToast("Article supprimé.");
                        renderCart();
                    } else {
                        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
                        e.target.value = currentCart.find(item => item.id === productId)?.quantity || 1;
                    }
                } else {
                    updateCartItemQuantity(productId, newQuantity);
                    renderCart();
                }
            });
        });

        // Events Suppression
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

    renderCart();

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

    // Commande via Formspree
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.textContent = "Envoi en cours...";
            submitBtn.disabled = true;

            try {
                const formData = new FormData(orderForm);
                const response = await fetch(orderForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    showToast('Commande validée avec succès !');
                    localStorage.removeItem('cart'); 
                    setTimeout(() => { window.location.href = "index.html"; }, 1500);
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
