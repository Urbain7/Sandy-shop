/**
 * Affiche une notification toast personnalisée.
 * @param {string} message Le message à afficher.
 */
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        
        // Fait disparaître la notification après 3 secondes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

/**
 * Formate un nombre en chaîne de caractères monétaire FCFA.
 * @param {number} price Le prix à formater.
 * @returns {string} Le prix formaté (ex: "59 000 FCFA").
 */
function formatPrice(price) {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
        console.error("Erreur: Un prix invalide a été détecté:", price);
        return 'Prix non disponible';
    }
    return priceNumber.toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Ajoute un produit au panier dans le localStorage.
 * @param {object} product L'objet produit à ajouter.
 */
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}```

---

### **2. Fichier `/js/main.js` (Version Finale Corrigée)**

Ce fichier est maintenant simplifié et ne gère que la logique de la page d'accueil.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Affiche l'aperçu des catégories sur la page d'accueil.
     */
    const displayCategoryPreview = (products) => {
        const categoryPreview = document.getElementById('category-preview');
        if (!categoryPreview) return;

        const categories = [...new Set(products.map(p => p.categorie))];
        categoryPreview.innerHTML = '';

        categories.slice(0, 4).forEach(category => {
            const product = products.find(p => p.categorie === category);
            if (product) {
                const categoryCard = `
                    <div class="product-card">
                        <a href="produit.html?id=${product.id}" class="product-link">
                            <img src="${product.image}" alt="${product.categorie}">
                            <h3>${product.categorie}</h3>
                        </a>
                        <a href="produits.html?categorie=${category}" class="btn">Découvrir</a>
                    </div>
                `;
                categoryPreview.innerHTML += categoryCard;
            }
        });
    };

    /**
     * Gère l'affichage et l'interaction des stories.
     */
    const handleStories = (products) => {
        const storiesContainer = document.getElementById('stories-container');
        const storyViewer = document.getElementById('story-viewer');
        const closeStoryBtn = document.getElementById('close-story');
        const storyContent = storyViewer.querySelector('.story-content');

        if (!storiesContainer || !storyViewer) return;

        const storyProducts = products.filter(p => p.in_story === true);

        if (storyProducts.length === 0) {
            const storiesSection = document.querySelector('.stories-section');
            if (storiesSection) storiesSection.style.display = 'none';
            return;
        }

        storyProducts.forEach(product => {
            const storyElement = document.createElement('div');
            storyElement.className = 'story-item';
            storyElement.dataset.productId = product.id;
            storyElement.innerHTML = `
                <div class="story-circle">
                    <img src="${product.image}" alt="${product.nom}">
                </div>
                <span>${product.nom}</span>
            `;
            storiesContainer.appendChild(storyElement);
        });

        storiesContainer.addEventListener('click', (e) => {
            const storyItem = e.target.closest('.story-item');
            if (storyItem) {
                const productId = storyItem.dataset.productId;
                const product = products.find(p => p.id == productId);

                if (product) {
                    let mediaElement = '';
                    if (product.story_video) {
                        mediaElement = `<video src="${product.story_video}" autoplay muted loop playsinline></video>`;
                    } else {
                        mediaElement = `<img src="${product.image}" alt="${product.nom}">`;
                    }
                    storyContent.innerHTML = `${mediaElement}<a href="produit.html?id=${product.id}" class="btn">Voir le produit</a>`;
                    storyViewer.classList.add('show');
                }
            }
        });

        const closeViewer = () => {
            storyViewer.classList.remove('show');
            storyContent.innerHTML = "";
        };

        if(closeStoryBtn) closeStoryBtn.addEventListener('click', closeViewer);
        storyViewer.addEventListener('click', (e) => {
            if (e.target === storyViewer) {
                closeViewer();
            }
        });
    };

    /**
     * Fonction principale qui charge les données et initialise les sections.
     */
    const main = async () => {
        try {
            const response = await fetch('data/produits.json');
            if (!response.ok) throw new Error('Could not fetch products.');
            const products = await response.json();
            
            handleStories(products);
            displayCategoryPreview(products);

        } catch (error) {
            console.error('Failed to initialize homepage sections:', error);
        }
    };

    main();
});
