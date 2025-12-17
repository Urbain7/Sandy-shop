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
 * @returns {Promise<boolean>} Une promesse qui se résout à `true` si l'utilisateur confirme.
 */
function showCustomConfirm(message) {
    return new Promise(resolve => {
        const modal = document.getElementById('custom-confirm-modal');
        const msgElement = document.getElementById('custom-confirm-msg');
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');

        if (!modal || !msgElement || !okBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }

        msgElement.textContent = message;
        modal.classList.add('show');

        const handleOk = () => {
            modal.classList.remove('show');
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };
        
        const handleCancel = () => {
            modal.classList.remove('show');
            okBtn.removeEventListener('click', handleOk);
            resolve(false);
        };

        okBtn.addEventListener('click', handleOk, { once: true });
        cancelBtn.addEventListener('click', handleCancel, { once: true });
    });
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
 * Ajoute un produit au panier.
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
    updateCartIcon();
}

/**
 * Met à jour la quantité d'un produit.
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
        updateCartIcon();
    }
}

/**
 * Supprime un produit du panier.
 */
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
}

// Initialisation au chargement
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
                <strong> Cookies & Confidentialité</strong><br>
                Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience.
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
            loadGoogleAnalytics(); // On lance le tracking
            countNewVisitor();     // On compte le visiteur unique
            closeBanner(banner);
        });

        // --- ACTION : REFUSER ---
        document.getElementById('decline-cookies').addEventListener('click', () => {
            localStorage.setItem("cookieConsent", "refused");
            countNewVisitor();     // On compte quand même le visiteur (anonyme)
            // On NE lance PAS le tracking Google
            closeBanner(banner);
        });
    }
    setTimeout(() => banner.classList.add('show'), 100);
}

function closeBanner(banner) {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 500);
}

// Fonction qui insère le code Google (GTM) dynamiquement
function loadGoogleAnalytics() {
    if (document.getElementById('gtm-script')) return;

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-59W7JKXZ'; // Votre ID GTM

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

// --- NOUVELLE FONCTION DE COMPTAGE (API V2) ---
function countNewVisitor() {
    // Espace de nom et clé (Identiques à ceux de stats.html)
    const namespace = 'sandyshop-v1'; 
    const key = 'visites';

    // On appelle l'URL avec "/up" pour ajouter +1
    fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/up`)
        .then(response => response.json())
        .then(data => {
            console.log("Nouveau visiteur compté :", data.count);
        })
        .catch(err => console.log("Erreur compteur (Bloqueur de pub ?)", err));
}
