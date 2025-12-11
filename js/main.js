document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialiser la page d'accueil
    const main = async () => {
        try {
            // Charger les produits pour les Stories et Catégories
            const response = await fetch('data/produits.json');
            if (!response.ok) throw new Error('Erreur produits');
            const data = await response.json();
            const products = data.items ? data.items : data;
            
            handleStories(products);
            displayCategoryPreview(products);
            
            // NOUVEAU : Charger les Avis
            loadTestimonials();

        } catch (error) {
            console.error('Erreur chargement:', error);
        }
    };

    // 2. Fonction pour les Stories
    const handleStories = (products) => {
        const storiesContainer = document.getElementById('stories-container');
        const storyViewer = document.getElementById('story-viewer');
        const closeStoryBtn = document.getElementById('close-story');
        const storyContent = storyViewer.querySelector('.story-content');

        if (!storiesContainer || !storyViewer) return;

        const storyProducts = products.filter(p => p.in_story === true);
        if (storyProducts.length === 0) {
            document.querySelector('.stories-section').style.display = 'none'; 
            return;
        }

        storyProducts.forEach(product => {
            const storyElement = document.createElement('div');
            storyElement.className = 'story-item';
            storyElement.dataset.productId = product.id; 
            storyElement.innerHTML = `<div class="story-circle"><img src="${product.image}" alt="${product.nom}" loading="lazy"><span>${product.nom}</span></div>`;
            storiesContainer.appendChild(storyElement);
        });

        storiesContainer.addEventListener('click', (e) => {
            const storyItem = e.target.closest('.story-item');
            if (storyItem) {
                const product = products.find(p => p.id == storyItem.dataset.productId);
                if (product) {
                    storyContent.innerHTML = `<img src="${product.image}" alt="${product.nom}"><a href="produit.html?id=${product.id}" class="btn">Voir le produit</a>`;
                    storyViewer.classList.add('show');
                }
            }
        });

        const closeViewer = () => { storyViewer.classList.remove('show'); storyContent.innerHTML = ""; };
        if(closeStoryBtn) closeStoryBtn.addEventListener('click', closeViewer);
        storyViewer.addEventListener('click', (e) => { if (e.target === storyViewer) closeViewer(); });
    };

    // 3. Fonction pour les Catégories
    const displayCategoryPreview = (products) => {
        const categoryPreview = document.getElementById('category-preview');
        if (!categoryPreview) return;
        // Mélanger pour ne pas toujours montrer les mêmes
        const shuffled = products.sort(() => 0.5 - Math.random());
        const categories = [...new Set(shuffled.map(p => p.categorie))].slice(0, 4);
        
        categoryPreview.innerHTML = '';
        categories.forEach(category => {
            const product = products.find(p => p.categorie === category);
            if (product) {
                categoryPreview.innerHTML += `
                    <div class="product-card" data-aos="fade-up">
                        <a href="produit.html?id=${product.id}" class="product-link">
                            <img src="${product.image}" alt="${category}" loading="lazy">
                            <h3>${category}</h3>
                        </a>
                        <a href="produits.html?categorie=${encodeURIComponent(category)}" class="btn">Découvrir</a>
                    </div>
                `;
            }
        });
    };

    // 4. NOUVEAU : Fonction pour charger les Avis dynamiques
    const loadTestimonials = async () => {
        const container = document.querySelector('.testimonials-grid');
        if (!container) return;

        try {
            const response = await fetch('data/avis.json');
            if (!response.ok) return; // Si pas de fichier, on garde le HTML par défaut
            
            const data = await response.json();
            const avis = data.items ? data.items : data;

            if (avis.length > 0) {
                container.innerHTML = ''; // On vide les faux avis
                avis.forEach(item => {
                    container.innerHTML += `
                        <div class="testimonial-card" data-aos="fade-up">
                            <p class="testimonial-text">"${item.message}"</p>
                            <span class="testimonial-author">— ${item.nom}</span>
                        </div>
                    `;
                });
            }
        } catch (e) {
            console.log("Pas d'avis chargés");
        }
    };

    main(); 
});
