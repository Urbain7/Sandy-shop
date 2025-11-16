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
        // Crée une liste des ID de produits qui sont "likés" (valeur à true)
        const likedProductIds = Object.keys(likes).filter(id => likes[id]);

        if (likedProductIds.length === 0) {
            favoritesGrid.innerHTML = '<p style="text-align: center; padding: 2rem 0;">Vous n\'avez encore aucun produit en favori.</p>';
            return;
        }

        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Impossible de charger les produits.');
        const allProducts = await response.json();

        // Filtre la liste complète des produits pour ne garder que ceux qui sont dans nos favoris
        const favoriteProducts = allProducts.filter(product => likedProductIds.includes(product.id));

        if (favoriteProducts.length === 0) {
            favoritesGrid.innerHTML = '<p style="text-align: center; padding: 2rem 0;">Certains de vos favoris n\'ont pas pu être trouvés.</p>';
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
    favoritesGrid.innerHTML = ''; // Nettoie la grille

    products.forEach(product => {
        // On réutilise la même structure de carte que sur la page des produits
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <a href="produit.html?id=${product.id}" class="product-link">
                <img src="${product.image}" alt="${product.nom}">
                <h3>${product.nom}</h3>
            </a>
            <p class="product-price">${formatPrice(product.prix)}</p>
            <div class="product-actions">
                <button class="btn add-to-cart" data-id="${product.id}">Ajouter au panier</button>
                <!-- On affiche le bouton "like" déjà activé -->
                <button class="like-btn liked" data-id="${product.id}">
                    ❤️ <span class="like-count">1</span>
                </button>
            </div>
        `;
        favoritesGrid.appendChild(productCard);
    });

    // On attache les écouteurs d'événements pour que les boutons fonctionnent
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
                
                // Ici, cliquer sur le cœur le retire des favoris
                delete likes[productId]; 
                
                localStorage.setItem('likes', JSON.stringify(likes));
                
                // Fait disparaître la carte de la page des favoris
                const cardToRemove = likeBtn.closest('.product-card');
                cardToRemove.style.transition = 'opacity 0.3s ease';
                cardToRemove.style.opacity = '0';
                setTimeout(() => {
                    cardToRemove.remove();
                    // Si c'était le dernier favori, on affiche le message
                    if (document.querySelectorAll('#favorites-grid .product-card').length === 0) {
                        document.getElementById('favorites-grid').innerHTML = '<p style="text-align: center; padding: 2rem 0;">Vous n\'avez plus de produit en favori.</p>';
                    }
                }, 300);
            });
        }
    });
}
