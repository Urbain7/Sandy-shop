document.addEventListener('DOMContentLoaded', () => {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (favoritesGrid) {
        loadFavoriteProducts();
    }
});

async function loadFavoriteProducts() {
    const favoritesGrid = document.getElementById('favorites-grid');
    
    try {
        const likes = JSON.parse(localStorage.getItem('likes')) || {};
        const likedProductIds = Object.keys(likes).filter(id => likes[id]);

        if (likedProductIds.length === 0) {
            favoritesGrid.innerHTML = '<p class="empty-grid-message">Vous n\'avez encore aucun produit en favori.</p>';
            return;
        }

        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Impossible de charger les produits.');
        
        // --- CORRECTION CMS ICI AUSSI ---
        const data = await response.json();
        const allProducts = data.items ? data.items : data;
        // --------------------------------

        const favoriteProducts = allProducts.filter(product => likedProductIds.includes(product.id));

        if (favoriteProducts.length === 0) {
            favoritesGrid.innerHTML = '<p class="empty-grid-message">Vous n\'avez encore aucun produit en favori.</p>';
            return;
        }

        displayFavoriteProducts(favoriteProducts);

    } catch (error) {
        console.error("Erreur lors du chargement des favoris:", error);
        favoritesGrid.innerHTML = `<p class="error-message">Une erreur est survenue lors du chargement de vos favoris.</p>`;
    }
}

function displayFavoriteProducts(products) {
    const favoritesGrid = document.getElementById('favorites-grid');
    favoritesGrid.innerHTML = ''; 

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="produit.html?id=${product.id}" class="product-link">
                <img src="${product.image}" alt="${product.nom}" loading="lazy">
                <h3>${product.nom}</h3>
            </a>
            <p class="product-price">${formatPrice(product.prix)}</p>
            <div class="product-actions">
                <button class="btn add-to-cart" data-id="${product.id}">Ajouter au panier</button>
                <button class="like-btn liked" data-id="${product.id}">
                    ❤️ <span class="like-count">1</span>
                </button>
            </div>
        `;
        favoritesGrid.appendChild(productCard);
    });

    addEventListenersToFavoriteCards(products);
}

function addEventListenersToFavoriteCards(products) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        const productId = actions.dataset.id;
        
        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                const productToAdd = products.find(p => p.id == productId);
                if (productToAdd) {
                    addToCart(productToAdd);
                    showToast(`${productToAdd.nom} ajouté au panier !`);
                }
            });
        }

        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                let likes = JSON.parse(localStorage.getItem('likes')) || {};
                delete likes[productId]; 
                localStorage.setItem('likes', JSON.stringify(likes));
                
                const cardToRemove = likeBtn.closest('.product-card');
                cardToRemove.style.transition = 'opacity 0.3s ease';
                cardToRemove.style.opacity = '0';
                setTimeout(() => {
                    cardToRemove.remove();
                    if (document.querySelectorAll('#favorites-grid .product-card').length === 0) {
                        document.getElementById('favorites-grid').innerHTML = '<p class="empty-grid-message">Vous n\'avez encore aucun produit en favori.</p>';
                    }
                }, 300);
            });
        }
    });
}
