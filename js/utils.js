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
 * Affiche une boîte de dialogue de confirmation personnalisée.
 * @param {string} message Le message à afficher.
 * @returns {Promise<boolean>} Une promesse qui se résout à `true` si l'utilisateur confirme, `false` sinon.
 */
function showCustomConfirm(message) {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgElement = document.getElementById('custom-confirm-msg');
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');

        // Si la modal n'est pas trouvée, on utilise la confirmation par défaut du navigateur
        if (!modal || !msgElement || !okBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }

        msgElement.textContent = message;
        modal.classList.add('show');

        const handleOk = () => {
            modal.classList.remove('show');
            cancelBtn.removeEventListener('click', handleCancel); // Nettoie l'autre écouteur
            resolve(true);
        };
        
        const handleCancel = () => {
            modal.classList.remove('show');
            okBtn.removeEventListener('click', handleOk); // Nettoie l'autre écouteur
            resolve(false);
        };

        // Utilise { once: true } pour s'assurer que les écouteurs sont automatiquement retirés après usage
        okBtn.addEventListener('click', handleOk, { once: true });
        cancelBtn.addEventListener('click', handleCancel, { once: true });
    });
}

/**
 * Met à jour l'icône du panier dans l'en-tête en affichant le nombre total d'articles.
 */
function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.getElementById('cart-item-count');
    if (cartIcon) {
        // Calcule la somme des quantités de tous les articles dans le panier
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
    updateCartIcon(); // Met à jour l'icône après l'ajout
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
            cart.splice(itemIndex, 1); // Supprime l'article si la quantité est 0 ou moins
        } else {
            cart[itemIndex].quantity = newQuantity;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartIcon(); // Met à jour l'icône après la modification
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
    updateCartIcon(); // Met à jour l'icône après la suppression
}

// Assure que l'icône du panier est à jour dès que la page est chargée
document.addEventListener('DOMContentLoaded', updateCartIcon);
/* =============================== */
/* GESTION DES COOKIES & ANALYTICS */
/* =============================== */

document.addEventListener("DOMContentLoaded", () => {
    const consent = localStorage.getItem("cookieConsent"); // 'accepted' ou 'refused'

    // 1. Si déjà accepté, on charge Google Analytics tout de suite
    if (consent === "accepted") {
        loadGoogleAnalytics();
    }
    
    // 2. Si aucun choix n'a encore été fait, on affiche la bannière
    if (!consent) {
        createCookieBanner();
    }
    
    // 3. Lien "Gérer les cookies" du pied de page
    const manageLink = document.querySelector('.cky-banner-element');
    if(manageLink) {
        manageLink.addEventListener('click', (e) => {
            e.preventDefault();
            createCookieBanner();
        });
    }
});

function createCookieBanner() {
    let banner = document.getElementById('cookie-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-text">
                <strong>🍪 Bienvenue chez Sandy'Shop !</strong><br>
                En continuant, vous acceptez notre politique de confidentialité.
            </div>
            <div class="cookie-buttons">
                <button id="decline-cookies" class="btn-secondary" style="background:#fff; color:#333; border:1px solid #ccc;">Refuser</button>
                <button id="accept-cookies" class="btn">Accepter</button>
            </div>
        `;
        document.body.appendChild(banner);

        // --- ACTION : ACCEPTER ---
        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem("cookieConsent", "accepted");
            loadGoogleAnalytics(); 
            countNewVisitor(); // COMPTE LE VISITEUR
            closeBanner(banner);
        });

        // --- ACTION : REFUSER ---
        document.getElementById('decline-cookies').addEventListener('click', () => {
            localStorage.setItem("cookieConsent", "refused");
            countNewVisitor(); // COMPTE LE VISITEUR (Même s'il refuse, c'est un visiteur)
            closeBanner(banner);
        });
    }
    setTimeout(() => banner.classList.add('show'), 100);
}

// --- NOUVELLE FONCTION DE COMPTAGE ---
// --- NOUVELLE FONCTION DE COMPTAGE (API V2) ---
function countNewVisitor() {
    // On utilise un espace de nom unique pour votre boutique
    // Remplacez 'sandyshop-v1' par un nom unique si besoin
    const namespace = 'sandyshop-v1'; 
    const key = 'visites';

    fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/up`)
        .then(response => response.json())
        .then(data => {
            console.log("Nouveau visiteur compté :", data.count);
        })
        .catch(err => console.log("Erreur compteur (Bloqueur de pub ?)", err));
}

function closeBanner(banner) {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 500);
}

// Fonction qui insère le code Google (GTM) dynamiquement
function loadGoogleAnalytics() {
    // On vérifie si le script est déjà là pour ne pas le mettre 2 fois
    if (document.getElementById('gtm-script')) return;

    // Création du script principal GTM
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-59W7JKXZ'; // Votre ID GTM

    // Le petit script de démarrage GTM
    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GTM-59W7JKXZ');
    `;

    document.head.appendChild(script);
    document.head.appendChild(inlineScript);
    console.log("Google Analytics activé ✅");
}
