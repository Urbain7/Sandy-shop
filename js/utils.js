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
}
