/* =============================== */
/* 1. GESTION DEVISE & PRIX        */
/* =============================== */

// Configuration par défaut
let SHOP_CURRENCY = { symbol: 'FCFA', position: 'after' };

// Charge la configuration définie dans l'Admin
async function loadShopSettings() {
    try {
        const response = await fetch('data/settings.json');
        if (response.ok) {
            const settings = await response.json();
            SHOP_CURRENCY = settings;
            localStorage.setItem('shopSettings', JSON.stringify(settings));
        }
    } catch (e) {
        // En cas d'erreur, on utilise le cache ou la valeur par défaut
        const cached = localStorage.getItem('shopSettings');
        if (cached) SHOP_CURRENCY = JSON.parse(cached);
    }
}
loadShopSettings(); // Lancement immédiat

// Fonction de formatage (1000 -> "1 000 FCFA" ou "$ 1,000")
function formatPrice(price) {
    const priceNumber = Number(price);
    if (isNaN(priceNumber)) return 'Prix sur demande';

    const formattedNumber = priceNumber.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    });

    if (SHOP_CURRENCY.position === 'before') {
        return `${SHOP_CURRENCY.symbol} ${formattedNumber}`;
    } else {
        return `${formattedNumber} ${SHOP_CURRENCY.symbol}`;
    }
}

/* =============================== */
/* 2. NOTIFICATIONS & UI           */
/* =============================== */

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }
}

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

/* =============================== */
/* 3. GESTION DU PANIER            */
/* =============================== */

function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartIcon = document.getElementById('cart-item-count');
    
    if (cartIcon) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (totalItems > 0) {
            cartIcon.textContent = totalItems;
            cartIcon.classList.add('visible');
            
            // Animation "Rebond" (Visual Feedback)
            cartIcon.classList.remove('cart-bump');
            void cartIcon.offsetWidth; // Force le redessin
            cartIcon.classList.add('cart-bump');
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

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', updateCartIcon);

/* =============================== */
/* 4. COOKIES & ANALYTICS          */
/* =============================== */

document.addEventListener("DOMContentLoaded", () => {
    const consent = localStorage.getItem("cookieConsent");
    if (consent === "accepted") loadGoogleAnalytics();
    if (!consent) createCookieBanner();
    
    const manageLink = document.querySelector('.cky-banner-element');
    if(manageLink) manageLink.addEventListener('click', (e) => { e.preventDefault(); createCookieBanner(); });
});

function createCookieBanner() {
    if (document.getElementById('cookie-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-text"><strong>🍪 Cookies</strong><br>Nous utilisons des cookies pour analyser le trafic.</div>
        <div class="cookie-buttons">
            <button id="decline-cookies" class="btn-secondary" style="background:#fff; color:#333; border:1px solid #ccc;">Refuser</button>
            <button id="accept-cookies" class="btn">Accepter</button>
        </div>`;
    document.body.appendChild(banner);

    document.getElementById('accept-cookies').addEventListener('click', () => {
        localStorage.setItem("cookieConsent", "accepted");
        loadGoogleAnalytics();
        closeBanner();
    });
    document.getElementById('decline-cookies').addEventListener('click', () => {
        localStorage.setItem("cookieConsent", "refused");
        closeBanner();
    });
    setTimeout(() => banner.classList.add('show'), 100);
}

function closeBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) { banner.classList.remove('show'); setTimeout(() => banner.remove(), 500); }
}

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
}
