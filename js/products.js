document.addEventListener('DOMContentLoaded', () => {
    // Exécute la fonction d'initialisation appropriée en fonction de la page actuelle
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
        const sortBy = document.getElementById('sort-by');
        
        // Remplissage du filtre des catégories
        const categories = [...new Set(products.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        // Appliquer un filtre de catégorie initial si présent dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) {
            categoryFilter.value = initialCategory;
        }

        function handleFilterAndSort() {
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.toLowerCase();
            const sortValue = sortBy.value;
            let filteredProducts = [...products]; // Copie pour ne pas altérer le tableau original

            // 1. Filtrer par catégorie
            if (category !== 'all') {
                filteredProducts = filteredProducts.filter(p => p.categorie === category);
            }
            // 2. Filtrer par recherche
            if (searchTerm) {
                filteredProducts = filteredProducts.filter(p => 
                    p.nom.toLowerCase().includes(searchTerm) || 
                    p.description.toLowerCase().includes(searchTerm)
                );
            }
            // 3. Trier les résultats
            switch (sortValue) {
                case 'price-asc':
                    filteredProducts.sort((a, b) => a.prix - b.prix);
                    break;
                case 'price-desc':
                    filteredProducts.sort((a, b) => b.prix - a.prix);
                    break;
                case 'name-asc':
                    filteredProducts.sort((a, b) => a.nom.localeCompare(b.nom));
                    break;
                case 'name-desc':
                    filteredProducts.sort((a, b) => b.nom.localeCompare(a.nom));
                    break;
            }
            displayProducts(filteredProducts);
        }

        // Ajouter les écouteurs d'événements pour les filtres et le tri
        categoryFilter.addEventListener('change', handleFilterAndSort);
        searchInput.addEventListener('input', handleFilterAndSort);
        sortBy.addEventListener('change', handleFilterAndSort);
        
        // Affichage initial des produits
        handleFilterAndSort();

    } catch (error) {
        console.error("Erreur critique lors du chargement des produits:", error);
        const productList = document.getElementById('product-list');
        if(productList) productList.innerHTML = `<p class="error-message">Impossible de charger le catalogue. Veuillez réessayer plus tard.</p>`;
    }
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    const likes = JSON.parse(localStorage.getItem('likes')) || {};
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = `<p style="text-align: center; padding: 2rem 0;">Aucun produit ne correspond à votre recherche.</p>`;
        return;
    }

    products.forEach(product => {
        const isLiked = likes[product.id] || false;
        const likeCount = isLiked ? 1 : 0;
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
        
        // Logique du bouton "like"
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

        // Logique du bouton "Ajouter au panier" avec feedback visuel
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

// ===============================================
// LOGIQUE SPÉCIFIQUE À LA PAGE DÉTAIL PRODUIT
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

        const productImages = product.images && product.images.length > 0 ? product.images : [product.image];
        container.innerHTML = `
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-image"><img src="${productImages[0]}" alt="${product.nom}" id="main-product-image"></div>
                    <div class="thumbnail-images">${productImages.map((img, index) => `<img src="${img}" alt="Vue ${index + 1}" class="${index === 0 ? 'active' : ''}">`).join('')}</div>
                </div>
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    <p class="product-price">${formatPrice(product.prix)}</p>
                    <div class="product-options">
                        <label for="product-quantity">Quantité :</label>
                        <input type="number" id="product-quantity" value="1" min="1" max="99" style="width: 60px; padding: 0.5rem; text-align: center; border-radius: 5px; border: 1px solid var(--input-border-color);">
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

    if (!cartContainer || !orderSection || !clearCartBtn || !cartHeader || !cartContentInput || !cartTotalInput) {
        console.error("Un ou plusieurs éléments HTML essentiels du panier sont manquants.");
        return;
    }

    const renderCart = () => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

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
                    <td>${item.nom}</td>
                    <td>${formatPrice(item.prix)}</td>
                    <td><input type="number" class="cart-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99"></td>
                    <td>${formatPrice(totalLigne)}</td>
                    <td><button class="btn-secondary remove-from-cart-btn" data-id="${item.id}">Supprimer</button></td>
                </tr>
            `;
            cartTextSummary += `${item.nom} (Quantité: ${item.quantity}) - Total: ${formatPrice(totalLigne)}\\n`;
        });

        cartHTML += `</tbody></table><div class="cart-total">Total : ${formatPrice(totalGlobal)}</div>`;
        cartContainer.innerHTML = cartHTML;
        cartContentInput.value = cartTextSummary;
        cartTotalInput.value = formatPrice(totalGlobal);

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

    clearCartBtn.addEventListener('click', async () => {
        const confirmed = await showCustomConfirm("Voulez-vous vraiment vider votre panier ?");
        if (confirmed) {
            localStorage.removeItem('cart');
            showToast("Panier vidé !");
            renderCart();
        }
    });

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            showToast('Commande envoyée !');
            setTimeout(() => {
                localStorage.removeItem('cart');
                orderForm.submit(); // Soumet le formulaire après un court délai
            }, 1500);
        });
    }
}
