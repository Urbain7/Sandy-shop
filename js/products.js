document.addEventListener('DOMContentLoaded', () => {
    // --- ROUTAGE (Détermine sur quelle page on est) ---
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

// =================================================================
// 1. PAGE CATALOGUE (produits.html)
// =================================================================

/**
 * Affiche des squelettes de chargement en attendant les données
 */
function displaySkeletonCards() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = ''; 
    for (let i = 0; i < 8; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'product-card skeleton';
        skeletonCard.innerHTML = `<div class="skeleton-img"></div><div class="skeleton-text long"></div><div class="skeleton-text short"></div>`;
        productList.appendChild(skeletonCard);
    }
}

/**
 * Mélange les produits pour l'affichage aléatoire
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function initProduitsPage() {
    const productList = document.getElementById('product-list');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    displaySkeletonCards();

    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Fichier JSON introuvable');
        
        const data = await response.json();
        const allProducts = data.items ? data.items : data;
        
        // Mélange initial
        shuffleArray(allProducts);

        // --- CONFIGURATION PAGINATION ---
        const ITEMS_PER_PAGE = 12; 
        let currentPage = 1;
        let currentFilteredProducts = [];

        // --- FILTRES ---
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const sortBy = document.getElementById('sort-by');
        
        // Remplissage des catégories
        const categories = [...new Set(allProducts.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Pré-sélection catégorie via URL
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) {
            categoryFilter.value = initialCategory;
        }

        // Fonction principale de filtrage
        function applyFilters() {
            let tempProducts = [...allProducts];
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            const sortValue = sortBy.value;

            // Filtres
            if (category !== 'all') tempProducts = tempProducts.filter(p => p.categorie === category);
            if (searchTerm) tempProducts = tempProducts.filter(p => p.nom.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm));

            // Tris
            switch (sortValue) {
                case 'price-asc': tempProducts.sort((a, b) => a.prix - b.prix); break;
                case 'price-desc': tempProducts.sort((a, b) => b.prix - a.prix); break;
                case 'name-asc': tempProducts.sort((a, b) => a.nom.localeCompare(b.nom)); break;
                case 'name-desc': tempProducts.sort((a, b) => b.nom.localeCompare(a.nom)); break;
            }

            currentFilteredProducts = tempProducts;
            currentPage = 1;
            productList.innerHTML = '';
            renderBatch();
        }

        // Fonction d'affichage par lot (Pagination)
        function renderBatch() {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const productsToRender = currentFilteredProducts.slice(start, end);

            if (currentFilteredProducts.length === 0) {
                productList.innerHTML = `<p class="empty-grid-message">Aucun produit trouvé.</p>`;
                loadMoreContainer.style.display = 'none';
                return;
            }

            productsToRender.forEach(product => {
                const likes = JSON.parse(localStorage.getItem('likes')) || {};
                const isLiked = likes[product.id] || false;
                const isOutOfStock = product.stock === 0;
                const cartButtonHTML = isOutOfStock ? `<button class="btn out-of-stock-btn" disabled>Épuisé</button>` : `<button class="btn add-to-cart">Ajouter</button>`;
                
                const productCard = document.createElement('div');
                productCard.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
                productCard.setAttribute('data-aos', 'fade-up');

                productCard.innerHTML = `
                    <a href="produit.html?id=${product.id}" class="product-link">
                        <img src="${product.image}" alt="${product.nom}" loading="lazy">
                        <h3>${product.nom}</h3>
                    </a>
                    <p class="product-price">${formatPrice(product.prix)}</p> 
                    <div class="product-actions" data-id="${product.id}">
                        ${cartButtonHTML}
                        <button class="like-btn ${isLiked ? 'liked' : ''}">❤️</button>
                    </div>
                `;
                
                // Alerte stock faible
                if (product.stock > 0 && product.stock <= 3) {
                    productCard.insertAdjacentHTML('beforeend', `<div class="stock-alert" style="margin-bottom:10px;">🔥 Vite ! Plus que ${product.stock} !</div>`);
                }
                productList.appendChild(productCard);
            });

            // Gérer la visibilité du bouton "Voir plus"
            loadMoreContainer.style.display = (end >= currentFilteredProducts.length) ? 'none' : 'block';
            
            // Réactiver les écouteurs
            addEventListenersToCards(allProducts);
            
            // Rafraîchir les animations AOS avec un petit délai pour le mobile
            setTimeout(() => { if (typeof AOS !== 'undefined') AOS.refresh(); }, 100);
        }

        // Écouteurs sur les filtres
        categoryFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', () => {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(applyFilters, 300);
        });
        sortBy.addEventListener('change', applyFilters);
        
        // Écouteur sur le bouton "Voir plus"
        loadMoreBtn.addEventListener('click', () => { currentPage++; renderBatch(); });

        // Lancement initial
        applyFilters();

    } catch (error) {
        console.error("Erreur Catalogue:", error);
        if(productList) productList.innerHTML = `<p class="error-message">Impossible de charger le catalogue.</p>`;
    }
}

/**
 * Ajoute les événements (Panier, Like) sur les cartes produits
 */
function addEventListenersToCards(allProducts) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        // Eviter les doublons d'écouteurs
        if(actions.getAttribute('data-listening') === 'true') return;
        actions.setAttribute('data-listening', 'true');

        const productId = actions.dataset.id;
        
        // Like
        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                let likes = JSON.parse(localStorage.getItem('likes')) || {};
                likes[productId] = !likes[productId];
                localStorage.setItem('likes', JSON.stringify(likes));
                likeBtn.classList.toggle('liked', likes[productId]);
            });
        }
        
        // Panier Rapide (Sans taille)
        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const productToAdd = allProducts.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                    showToast(`${productToAdd.nom} ajouté !`);
                    
                    // Feedback visuel
                    const originalText = cartBtn.innerHTML;
                    cartBtn.innerHTML = '✔';
                    cartBtn.disabled = true;
                    setTimeout(() => { cartBtn.innerHTML = originalText; cartBtn.disabled = false; }, 2000);
                }
            });
        }
    });
}

// =================================================================
// 2. PAGE DÉTAIL PRODUIT (produit.html)
// =================================================================

async function initProduitDetailPage() {
    const container = document.getElementById('product-detail-container');
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) { container.innerHTML = "<p class='error-message'>Produit non trouvé.</p>"; return; }

    try {
        const response = await fetch('data/produits.json');
        const data = await response.json();
        const allProducts = data.items ? data.items : data;
        const product = allProducts.find(p => p.id == productId);
        if (!product) { container.innerHTML = "<p class='error-message'>Produit introuvable.</p>"; return; }

        document.title = `${product.nom} - Sandy'Shop`;
        
        const isOutOfStock = product.stock === 0;
        const cartButtonHTML = isOutOfStock ? `<button class="btn out-of-stock-btn" disabled>Épuisé</button>` : `<button class="btn add-to-cart-detail">Ajouter au panier</button>`;
        const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
        
        // --- GESTION DES TAILLES ---
        let sizesHTML = '';
        if (product.tailles) {
            const sizesList = product.tailles.split(',').map(s => s.trim());
            sizesHTML = `
                <div class="product-sizes">
                    <label>Choisir une Taille :</label>
                    <div class="size-options">
                        ${sizesList.map((size, i) => `
                            <input type="radio" name="size" id="size-${i}" value="${size}" ${i===0 ? 'checked' : ''}>
                            <label for="size-${i}" class="size-box">${size}</label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // --- RENDU HTML COMPLET ---
        container.innerHTML = `
            <div class="product-detail" data-aos="fade-in">
                <div class="product-gallery">
                    <!-- IMAGE AVEC ZOOM -->
                    <div class="main-image-container" id="img-container">
                        <img src="${product.image}" alt="${product.nom}" id="main-product-image" class="zoom-image">
                    </div>
                    <div class="thumbnail-images">${productImages.map((img, index) => `<img src="${img}" alt="Vue ${index + 1}" class="${index === 0 ? 'active' : ''}">`).join('')}</div>
                </div>
                
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    <p class="product-price">${formatPrice(product.prix)}</p>
                    
                    ${sizesHTML}

                    <div class="product-options">
                        <label>Quantité :</label>
                        <input type="number" id="product-quantity" value="1" min="1" max="${product.stock || 99}" style="width:60px; padding:0.5rem; text-align:center;" ${isOutOfStock ? 'disabled' : ''}>
                    </div>
                    
                    <p class="product-description">${product.description}</p>
                    
                    ${cartButtonHTML}
                    
                    <!-- Container pour les boutons supplémentaires -->
                    <div id="extra-buttons-container"></div>
                </div>
            </div>
        `;

        // --- ALERTE STOCK FAIBLE ---
        if (product.stock > 0 && product.stock <= 3) {
            const alertHTML = `<div class="stock-alert" style="font-size:1rem; margin-bottom:1rem;">🔥 Attention, il ne reste que ${product.stock} exemplaires !</div>`;
            container.querySelector('h1').insertAdjacentHTML('afterend', alertHTML);
        }

        // --- BOUTONS WHATSAPP & PARTAGE ---
        const extrasContainer = document.getElementById('extra-buttons-container');

        // 1. Bouton WhatsApp Direct
        if (!isOutOfStock) {
            const waMessage = `Bonjour Sandy'Shop, je souhaite commander : ${product.nom} (${formatPrice(product.prix)}). Est-il dispo ?`;
            const waLink = `https://wa.me/22893899538?text=${encodeURIComponent(waMessage)}`;
            
            extrasContainer.innerHTML += `
                <a href="${waLink}" class="btn btn-whatsapp-order" target="_blank" style="margin-top: 15px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"/></svg>
                    Commander sur WhatsApp
                </a>
            `;
        }

        // 2. Bouton Partage Natif
        extrasContainer.innerHTML += `
            <div class="share-section" style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                <p style="font-size:0.9rem; margin-bottom:10px;">Ce produit pourrait plaire à une amie ?</p>
                <button id="native-share-btn" class="btn-secondary" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:10px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
                    Partager ce produit
                </button>
            </div>
        `;

        // Activation du partage natif
        setTimeout(() => {
            const shareBtn = document.getElementById('native-share-btn');
            if(shareBtn) {
                shareBtn.addEventListener('click', async () => {
                    const shareData = { title: `Sandy'Shop - ${product.nom}`, text: `Regarde ce produit : ${product.nom} (${formatPrice(product.prix)})`, url: window.location.href };
                    try {
                        const imgFetch = await fetch(product.image);
                        const blob = await imgFetch.blob();
                        const file = new File([blob], "produit.jpg", { type: blob.type });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: shareData.title, text: shareData.text, url: shareData.url }); }
                        else { await navigator.share(shareData); }
                    } catch (err) { window.open(`whatsapp://send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`); }
                });
            }
        }, 500);

        // --- ZOOM & GALERIE ---
        const imgContainer = document.getElementById('img-container');
        const mainImg = document.getElementById('main-product-image');
        const thumbnails = container.querySelectorAll('.thumbnail-images img');
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                mainImg.src = thumb.src;
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        if (window.innerWidth > 768 && imgContainer) {
            imgContainer.addEventListener("mousemove", (e) => {
                const rect = imgContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                mainImg.style.transformOrigin = `${x}px ${y}px`;
                mainImg.style.transform = "scale(2)";
            });
            imgContainer.addEventListener("mouseleave", () => {
                mainImg.style.transformOrigin = "center center";
                mainImg.style.transform = "scale(1)";
            });
        }

        // --- AJOUT AU PANIER (AVEC TAILLE) ---
        if (!isOutOfStock) {
            const btn = container.querySelector('.add-to-cart-detail');
            btn.addEventListener('click', () => {
                const qte = parseInt(document.getElementById('product-quantity').value);
                const sizeInput = container.querySelector('input[name="size"]:checked');
                const selectedSize = sizeInput ? sizeInput.value : '';
                
                // On crée une ID unique pour la combinaison Produit + Taille
                const productForCart = { 
                    ...product, 
                    id: product.id + (selectedSize ? '-' + selectedSize : ''), 
                    nom: product.nom + (selectedSize ? ` (Taille: ${selectedSize})` : '') 
                };
                addToCart(productForCart, qte);
                showToast("Ajouté au panier !");
            });
        }

        // Recommandations
        displayRecommendations(product, allProducts);

    } catch (e) { console.error(e); }
}

// =================================================================
// 3. RECOMMANDATIONS & PANIER
// =================================================================

function displayRecommendations(currentProduct, allProducts) {
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if (!recommendationsGrid) return;
    const recommended = allProducts.filter(p => p.categorie === currentProduct.categorie && p.id !== currentProduct.id).slice(0, 4);
    if (recommended.length > 0) {
        document.getElementById('recommendations-section').style.display = 'block';
        recommended.forEach(p => {
            recommendationsGrid.innerHTML += `
                <div class="product-card" data-aos="fade-up">
                    <a href="produit.html?id=${p.id}" class="product-link">
                        <img src="${p.image}"><h3>${p.nom}</h3>
                    </a>
                    <p class="product-price">${formatPrice(p.prix)}</p>
                </div>`;
        });
    }
}

async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;

    const renderCart = () => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            cartContainer.innerHTML = '<p class="empty-grid-message">Votre panier est vide.</p>';
            document.getElementById('order-section').style.display = 'none';
            return;
        }
        document.getElementById('order-section').style.display = 'block';
        let html = `<table class="cart-items" data-aos="fade-up"><thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th><th>Actions</th></tr></thead><tbody>`;
        let total = 0;
        let summary = "";
        cart.forEach(item => {
            const lineTotal = item.prix * item.quantity;
            total += lineTotal;
            html += `<tr><td data-label="Produit">${item.nom}</td><td data-label="Prix">${formatPrice(item.prix)}</td><td data-label="Quantité"><input type="number" class="cart-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99"></td><td data-label="Total">${formatPrice(lineTotal)}</td><td data-label="Actions"><button class="btn-secondary" onclick="removeFromCart('${item.id}'); location.reload();">Supprimer</button></td></tr>`;
            summary += `• ${item.nom} x${item.quantity} : ${formatPrice(lineTotal)}\n`;
        });
        html += `</tbody></table><div class="cart-total">Total : ${formatPrice(total)}</div>`;
        cartContainer.innerHTML = html;
        document.getElementById('cart-content').value = summary;
        document.getElementById('cart-total').value = formatPrice(total);

        // Events Quantité
        document.querySelectorAll('.cart-quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const pid = e.target.dataset.id;
                const qty = parseInt(e.target.value);
                if (qty > 0) { updateCartItemQuantity(pid, qty); renderCart(); }
            });
        });
    };
    renderCart();

    // Vider Panier
    const clearBtn = document.getElementById('clear-cart-btn');
    if(clearBtn) clearBtn.addEventListener('click', async () => {
        if(await showCustomConfirm("Vider le panier ?")) { localStorage.removeItem('cart'); renderCart(); }
    });

    // Formulaire Commande
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = orderForm.querySelector('button');
            btn.textContent = "Envoi..."; btn.disabled = true;
            try {
                const res = await fetch(orderForm.action, { method: 'POST', body: new FormData(orderForm), headers: { 'Accept': 'application/json' } });
                if (res.ok) { showToast("Commande envoyée !"); localStorage.removeItem('cart'); setTimeout(() => location.href="index.html", 1500); }
            } catch (e) { showToast("Erreur d'envoi."); btn.disabled = false; }
        });
    }
    }
