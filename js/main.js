document.addEventListener('DOMContentLoaded', () => {
    
    // Fonction pour afficher un aperçu des catégories sur la page d'accueil
    const displayCategoryPreview = (products) => {
        const categoryPreview = document.getElementById('category-preview');
        if (!categoryPreview) return;

        // Limiter à 4 catégories principales
        const categories = [...new Set(products.map(p => p.categorie))].slice(0, 4);
        categoryPreview.innerHTML = ''; // Nettoyer le contenu existant

        categories.forEach(category => {
            // Trouver un produit représentatif pour la catégorie (le premier trouvé)
            const product = products.find(p => p.categorie === category);
            if (product) {
                const categoryCard = `
                    <div class="product-card">
                        <!-- Le lien pointe vers la page produit du produit représentatif -->
                        <a href="produit.html?id=${product.id}" class="product-link">
                            <img src="${product.image}" alt="${product.categorie}">
                            <h3>${category}</h3> <!-- Afficher le nom de la catégorie -->
                        </a>
                        <!-- Le bouton "Découvrir" pointe vers la page produits avec le filtre de catégorie -->
                        <a href="produits.html?categorie=${encodeURIComponent(category)}" class="btn">Découvrir</a>
                    </div>
                `;
                categoryPreview.innerHTML += categoryCard;
            }
        });
    };

    // Fonction pour gérer l'affichage et l'interaction des stories
    const handleStories = (products) => {
        const storiesContainer = document.getElementById('stories-container');
        const storyViewer = document.getElementById('story-viewer');
        const closeStoryBtn = document.getElementById('close-story');
        const storyContent = storyViewer.querySelector('.story-content');

        if (!storiesContainer || !storyViewer) return;

        const storyProducts = products.filter(p => p.in_story === true);

        if (storyProducts.length === 0) {
            const storiesSection = document.querySelector('.stories-section');
            if (storiesSection) storiesSection.style.display = 'none'; // Masquer la section s'il n'y a pas de stories
            return;
        }

        storyProducts.forEach(product => {
            const storyElement = document.createElement('div');
            storyElement.className = 'story-item';
            storyElement.dataset.productId = product.id; // Stocker l'ID du produit pour le retrouver

            storyElement.innerHTML = `
                <div class="story-circle">
                    <img src="${product.image}" alt="${product.nom}">
                    <span>${product.nom}</span>
                </div>
            `;
            storiesContainer.appendChild(storyElement);
        });

        // Gestion de l'ouverture de la visionneuse de story
        storiesContainer.addEventListener('click', (e) => {
            const storyItem = e.target.closest('.story-item');
            if (storyItem) {
                const productId = storyItem.dataset.productId;
                const product = products.find(p => p.id == productId);

                if (product) {
                    let mediaElement = '';
                    if (product.story_video) {
                        mediaElement = `<video src="${product.story_video}" autoplay muted loop playsinline controls></video>`; // Ajout de 'controls'
                    } else {
                        mediaElement = `<img src="${product.image}" alt="${product.nom}">`;
                    }
                    storyContent.innerHTML = `${mediaElement}<a href="produit.html?id=${product.id}" class="btn">Voir le produit</a>`;
                    storyViewer.classList.add('show');
                }
            }
        });

        // Gestion de la fermeture de la visionneuse de story
        const closeViewer = () => {
            storyViewer.classList.remove('show');
            // Arrêter la vidéo si elle est en cours de lecture
            const video = storyContent.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
            storyContent.innerHTML = ""; // Nettoyer le contenu
        };

        if(closeStoryBtn) closeStoryBtn.addEventListener('click', closeViewer);
        // Fermer aussi si on clique en dehors de la story mais à l'intérieur de la visionneuse
        storyViewer.addEventListener('click', (e) => {
            if (e.target === storyViewer) {
                closeViewer();
            }
        });
    };

    // Fonction principale qui initialise toutes les sections de la page d'accueil
    const main = async () => {
        try {
            const response = await fetch('data/produits.json');
            if (!response.ok) throw new Error('Could not fetch products.');
            const products = await response.json();
            
            handleStories(products);
            displayCategoryPreview(products);

        } catch (error) {
            console.error('Failed to initialize homepage sections:', error);
            // Afficher des messages d'erreur si les données ne peuvent pas être chargées
            const storiesSection = document.querySelector('.stories-section');
            const categoryPreviewSection = document.querySelector('.container:nth-of-type(2)'); // Section des catégories
            if (storiesSection) storiesSection.innerHTML = `<p class="error-message">Impossible de charger les stories pour le moment.</p>`;
            if (categoryPreviewSection) categoryPreviewSection.innerHTML += `<p class="error-message">Impossible de charger les catégories pour le moment.</p>`;
        }
    };

    main(); // Exécuter la fonction principale au chargement du DOM
});
