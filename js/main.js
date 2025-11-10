document.addEventListener('DOMContentLoaded', () => {
    const displayCategoryPreview = async () => {
        try {
            const response = await fetch('data/produits.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const products = await response.json();
            const categoryPreview = document.getElementById('category-preview');

            if (!categoryPreview) return; // Ne rien faire si l'élément n'est pas sur la page

            const categories = [...new Set(products.map(p => p.categorie))];

            categoryPreview.innerHTML = ''; // Vider le conteneur avant d'ajouter
            categories.slice(0, 4).forEach(category => {
                const product = products.find(p => p.categorie === category);
                if (product) {
                    const categoryCard = `
                        <div class="product-card">
                            <img src="${product.image}" alt="${product.nom}">
                            <h3>${product.categorie}</h3>
                            <a href="produits.html?categorie=${category}" class="btn">Découvrir</a>
                        </div>
                    `;
                    categoryPreview.innerHTML += categoryCard;
                }
            });
        } catch (error) {
            console.error('Could not fetch products for category preview:', error);
        }
    };

    displayCategoryPreview();
});
