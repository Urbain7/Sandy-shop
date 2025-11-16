/**
 * Affiche une notification toast personnalisée.
 * @param {string} message Le message à afficher.
 */
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

/**
 * Formate un nombre en chaîne de caractères monétaire FCFA.
 * @param {number} price Le prix à formater.
 */
function formatPrice(price) {
    // ... (code inchangé)
}

/**
 * Affiche une boîte de dialogue de confirmation personnalisée.
 * @param {string} message Le message à afficher.
 */
function showCustomConfirm(message) {
    // ... (code inchangé)
}

/**
 * Met à jour l'icône du panier dans l'en-tête.
 */
function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.getElementById('cart-item-count');
    if (cartIcon) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 0) {
            cartIcon.textContent = totalItems;
            cartIcon.classList.add('visible');
        } else {
            cartIcon.classList.remove('visible');
        }
    }
}

/**
 * Ajoute un produit au panier dans le localStorage.
 * @param {object} product L'objet produit à ajouter.
 * @param {number} quantity La quantité à ajouter (par défaut: 1).
 */
function addToCart(product, quantity = 1) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon(); // Mise à jour de l'icône
}

/**
 * Met à jour la quantité d'un produit spécifique dans le panier.
 * @param {string} productId L'ID du produit.
 * @param {number} newQuantity La nouvelle quantité.
 */
function updateCartItemQuantity(productId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].quantity = newQuantity;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartIcon(); // Mise à jour de l'icône
    }
}

/**
 * Supprime un produit du panier.
 * @param {string} productId L'ID du produit à supprimer.
 */
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon(); // Mise à jour de l'icône
}

// Met à jour l'icône au chargement initial de la page
document.addEventListener('DOMContentLoaded', updateCartIcon);
