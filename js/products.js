document.addEventListener('DOMContentLoaded', () => {
    // ROUTAGE : Détermine la page active
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
// 1. PAGE CATALOGUE (PAGINATION & FILTRES)
// =================================================================

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
        
        shuffleArray(allProducts);

        // CONFIG PAGINATION
        const ITEMS_PER_PAGE = 12; 
        let currentPage = 1;
        let currentFilteredProducts = [];

        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const sortBy = document.getElementById('sort-by');
        
        // Remplissage catégories
        const categories = [...new Set(allProducts.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) {
            categoryFilter.value = initialCategory;
        }

        function applyFilters() {
            let tempProducts = [...allProducts];
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            const sortValue = sortBy.value;

            if (category !== 'all') tempProducts = tempProducts.filter(p => p.categorie === category);
            if (searchTerm) tempProducts = tempProducts.filter(p => p.nom.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm));

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
                
                if (product.stock > 0 && product.stock <= 3) {
                    productCard.insertAdjacentHTML('beforeend', `<div class="stock-alert" style="margin-bottom:10px;">🔥 Vite ! Plus que ${product.stock} !</div>`);
                }
                productList.appendChild(productCard);
            });

            loadMoreContainer.style.display = (end >= currentFilteredProducts.length) ? 'none' : 'block';
            addEventListenersToCards(allProducts);
            if (typeof AOS !== 'undefined') AOS.refresh();
        }

        categoryFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', () => {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(applyFilters, 300);
        });
        sortBy.addEventListener('change', applyFilters);
        loadMoreBtn.addEventListener('click', () => { currentPage++; renderBatch(); });

        applyFilters();

    } catch (error) {
        console.error("Erreur Catalogue:", error);
        if(productList) productList.innerHTML = `<p class="error-message">Erreur de chargement.</p>`;
    }
}

function addEventListenersToCards(allProducts) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        if(actions.getAttribute('data-listening') === 'true') return;
        actions.setAttribute('data-listening', 'true');

        const productId = actions.dataset.id;
        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                let likes = JSON.parse(localStorage.getItem('likes')) || {};
                likes[productId] = !likes[productId];
                localStorage.setItem('likes', JSON.stringify(likes));
                likeBtn.classList.toggle('liked', likes[productId]);
            });
        }
        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const productToAdd = allProducts.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                    showToast(`${productToAdd.nom} ajouté !`);
                }
            });
        }
    });
}

// =================================================================
// 2. PAGE DÉTAIL PRODUIT (ZOOM & TAILLES)
// =================================================================

async function initProduitDetailPage() {
    const container = document.getElementById('product-detail-container');
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) return;

    try {
        const response = await fetch('data/produits.json');
        const data = await response.json();
        const allProducts = data.items ? data.items : data;
        const product = allProducts.find(p => p.id == productId);
        if (!product) return;

        const isOutOfStock = product.stock === 0;
        const cartButtonHTML = isOutOfStock ? `<button class="btn out-of-stock-btn" disabled>Épuisé</button>` : `<button class="btn add-to-cart-detail">Ajouter au panier</button>`;
        const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
        
        // Gestion des Tailles
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

        container.innerHTML = `
            <div class="product-detail" data-aos="fade-in">
                <div class="product-gallery">
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
                </div>
            </div>
        `;

        // LOGIQUE ZOOM
        const imgContainer = document.getElementById('img-container');
        const mainImg = document.getElementById('main-product-image');
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

        // LOGIQUE PANIER
        if (!isOutOfStock) {
            const btn = container.querySelector('.add-to-cart-detail');
            btn.addEventListener('click', () => {
                const qte = parseInt(document.getElementById('product-quantity').value);
                const sizeInput = container.querySelector('input[name="size"]:checked');
                const selectedSize = sizeInput ? sizeInput.value : '';
                
                const productForCart = { 
                    ...product, 
                    id: product.id + (selectedSize ? '-' + selectedSize : ''), 
                    nom: product.nom + (selectedSize ? ` (${selectedSize})` : '') 
                };
                addToCart(productForCart, qte);
                showToast("Ajouté au panier !");
            });
        }

        displayRecommendations(product, allProducts);
        // Boutons WhatsApp et Partage (Injectés par marketing.js ou à rajouter ici)

    } catch (e) { console.error(e); }
}

// =================================================================
// 3. AUTRES PAGES (RECOMMANDATIONS & PANIER)
// =================================================================

function displayRecommendations(currentProduct, allProducts) {
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if (!recommendationsGrid) return;
    const recommended = allProducts.filter(p => p.categorie === currentProduct.categorie && p.id !== currentProduct.id).slice(0, 4);
    if (recommended.length > 0) {
        document.getElementById('recommendations-section').style.display = 'block';
        recommended.forEach(p => {
            recommendationsGrid.innerHTML += `<div class="product-card"><a href="produit.html?id=${p.id}"><img src="${p.image}"><h3>${p.nom}</h3></a><p class="product-price">${formatPrice(p.prix)}</p></div>`;
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
        let html = `<table class="cart-items"><thead><tr><th>Produit</th><th>Prix</th><th>Quantité</th><th>Total</th><th>Actions</th></tr></thead><tbody>`;
        let total = 0;
        let summary = "";
        cart.forEach(item => {
            const lineTotal = item.prix * item.quantity;
            total += lineTotal;
            html += `<tr><td>${item.nom}</td><td>${formatPrice(item.prix)}</td><td>${item.quantity}</td><td>${formatPrice(lineTotal)}</td><td><button class="btn-secondary" onclick="removeFromCart('${item.id}'); location.reload();">Supprimer</button></td></tr>`;
            summary += `• ${item.nom} x${item.quantity} : ${formatPrice(lineTotal)}\n`;
        });
        html += `</tbody></table><div class="cart-total">Total : ${formatPrice(total)}</div>`;
        cartContainer.innerHTML = html;
        document.getElementById('cart-content').value = summary;
        document.getElementById('cart-total').value = formatPrice(total);
    };
    renderCart();

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
