document.addEventListener('DOMContentLoaded', () => {
    
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
            
            // CORRECTION : Le span avec le nom est maintenant DANS le cercle
            storyElement.innerHTML = `
                <div class="story-circle">
                    <img src="${product.image}" alt="${product.nom}">
                    <span>${product.nom}</span>
                </div>
            `;
            storiesContainer.appendChild(storyElement);
        });

        // Le reste de la fonction est correct...
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

    const main = async () => {
        try {
            const response = await fetch('data/produits.json');
            if (!response.ok) throw new Error('Could not fetch products.');
            const products = await response.json();
            
            handleStories(products);
            displayCategoryPreview(products);

        } catch (error) {
            console.error('Failed to initialize homepage sections:', error);
            const storiesContainer = document.getElementById('stories-container');
            const categoryPreview = document.getElementById('category-preview');
            if(storiesContainer) storiesContainer.innerHTML = `<p class="error-message">Impossible de charger les stories.</p>`;
            if(categoryPreview) categoryPreview.innerHTML = `<p class="error-message">Impossible de charger les catégories.</p>`;
        }
    };

    main();
});
