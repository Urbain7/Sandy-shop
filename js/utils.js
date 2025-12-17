/**
 * Affiche une notification toast personnalisée.
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
 * Formate un nombre en FCFA.
 */
function formatPrice(price) {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) {
        return 'Prix non disponible';
    }
    return priceNumber.toLocaleString('fr-FR') + ' FCFA';
}

/**
 * Boîte de dialogue de confirmation.
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
 * Gestion du Panier (Icône, Ajout, Update, Suppr)
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

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
}

document.addEventListener('DOMContentLoaded', updateCartIcon);


/* ============================================== */
/* GESTION DES COOKIES & COMPTEUR INTELLIGENT     */
/* ============================================== */

document.addEventListener("DOMContentLoaded", () => {
    const consent = localStorage.getItem("cookieConsent"); // 'accepted' ou 'refused'

    // 1. Si déjà accepté, on charge tout
    if (consent === "accepted") {
        loadGoogleAnalytics();
        countNewVisitor(); // Tente de compter (vérifie la date)
    } 
    // 2. Si refusé, on tente juste de compter (anonyme)
    else if (consent === "refused") {
        countNewVisitor();
    }
    
    // 3. Si aucun choix, on affiche la bannière
    if (!consent) {
        createCookieBanner();
    }
    
    // Lien footer
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
                <strong>🍪 Cookies & Statistiques</strong><br>
                Nous utilisons des cookies pour analyser le trafic. Acceptez-vous le suivi ?
            </div>
            <div class="cookie-buttons">
                <button id="decline-cookies" class="btn-secondary" style="background:#fff; color:#333; border:1px solid #ccc;">Refuser</button>
                <button id="accept-cookies" class="btn">Accepter</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem("cookieConsent", "accepted");
            loadGoogleAnalytics();
            countNewVisitor();
            closeBanner(banner);
        });

        document.getElementById('decline-cookies').addEventListener('click', () => {
            localStorage.setItem("cookieConsent", "refused");
            countNewVisitor(); // On compte quand même le passage (anonyme)
            closeBanner(banner);
        });
    }
    setTimeout(() => banner.classList.add('show'), 100);
}

function closeBanner(banner) {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 500);
}
// ... (Code précédent du panier, confirm, etc...)

function loadGoogleAnalytics() {
    if (document.getElementById('gtm-script')) return;
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-59W7JKXZ'; 
    const inlineScript = document.createElement('script');
    inlineScript.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'GTM-59W7JKXZ');`;
    document.head.appendChild(script);
    document.head.appendChild(inlineScript);
    console.log("Google Analytics activé ✅");
}

// SUPPRIMEZ la fonction countNewVisitor() qui était ici.
// Elle n'est plus nécessaire.
