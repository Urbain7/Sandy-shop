/* =============================== */
/* GESTION DES DEVISES (AFRIQUE)   */
/* =============================== */

// Taux de change (Base : 1 FCFA)
// Modifiez ces valeurs selon le taux du jour
const EXCHANGE_RATES = {
    'XOF': { rate: 1, symbol: 'FCFA', name: 'Franc CFA (UEMOA/CEMAC)' },
    'NGN': { rate: 2.6, symbol: '₦', name: 'Naira (Nigeria)' },      // 1000 FCFA = ~2600 NGN
    'GHS': { rate: 0.022, symbol: '₵', name: 'Cedi (Ghana)' },       // 1000 FCFA = ~22 GHS
    'KES': { rate: 0.25, symbol: 'KSh', name: 'Shilling (Kenya)' },
    'MAD': { rate: 0.016, symbol: 'DH', name: 'Dirham (Maroc)' },
    'EUR': { rate: 0.00152, symbol: '€', name: 'Euro' },
    'USD': { rate: 0.00165, symbol: '$', name: 'Dollar US' }
};

// Fonction pour changer la devise
function setCurrency(currencyCode) {
    if (EXCHANGE_RATES[currencyCode]) {
        localStorage.setItem('selectedCurrency', currencyCode);
        location.reload(); // On recharge pour appliquer partout
    }
}

// Fonction principale de formatage
function formatPrice(priceInFCFA) {
    const priceNumber = Number(priceInFCFA);
    if (isNaN(priceNumber)) return 'Prix non disponible';

    // Récupérer la devise choisie (ou XOF par défaut)
    const currency = localStorage.getItem('selectedCurrency') || 'XOF';
    const rateData = EXCHANGE_RATES[currency];

    // Conversion
    const convertedPrice = priceNumber * rateData.rate;

    // Formatage propre (arrondi et séparateurs de milliers)
    return convertedPrice.toLocaleString('fr-FR', { 
        style: 'decimal', 
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    }) + ' ' + rateData.symbol;
}

/**
 * Génère le sélecteur de devise (à placer dans le HTML)
 */
function renderCurrencySelector() {
    const current = localStorage.getItem('selectedCurrency') || 'XOF';
    let options = '';
    for (const [code, data] of Object.entries(EXCHANGE_RATES)) {
        const selected = code === current ? 'selected' : '';
        options += `<option value="${code}" ${selected}>${data.symbol} - ${code}</option>`;
    }
    return `
        <select id="currency-selector" onchange="setCurrency(this.value)" class="currency-select">
            ${options}
        </select>
    `;
}

// ... (La suite du fichier showToast, showCustomConfirm etc. reste inchangée)
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


/* =============================== */
/* GESTION DES COOKIES & ANALYTICS */
/* =============================== */

document.addEventListener("DOMContentLoaded", () => {
    const consent = localStorage.getItem("cookieConsent"); // 'accepted' ou 'refused'

    // 1. Si déjà accepté, on charge Google Analytics
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
    // Si la bannière existe déjà, on ne la recrée pas
    if (document.getElementById('cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-text">
            <strong>🍪 Cookies & Confidentialité</strong><br>
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
        loadGoogleAnalytics(); 
        closeBanner(); // Appel sans paramètre
    });

    // --- ACTION : REFUSER ---
    document.getElementById('decline-cookies').addEventListener('click', () => {
        localStorage.setItem("cookieConsent", "refused");
        closeBanner(); // Appel sans paramètre
    });

    // Affichage avec petit délai pour l'animation
    setTimeout(() => banner.classList.add('show'), 100);
}

// Fonction de fermeture ROBUSTE
function closeBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        // 1. On lance l'animation de sortie (CSS)
        banner.classList.remove('show');
        
        // 2. On attend 0.5s et on détruit tout
        setTimeout(() => {
            banner.style.display = 'none'; // Force la disparition visuelle
            banner.remove();               // Supprime du code HTML
        }, 500);
    }
}

// Fonction qui insère le code Google (GTM) dynamiquement
function loadGoogleAnalytics() {
    if (document.getElementById('gtm-script')) return;

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-59W7JKXZ'; // ID GTM

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
