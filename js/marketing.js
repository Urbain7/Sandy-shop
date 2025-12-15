document.addEventListener("DOMContentLoaded", () => {
    loadFlashSale();
    loadLooks(); // Option 2 (Inspirations)
    loadFAQ();
    loadPopupVIP();
});

// --- 1. COMPTE À REBOURS ---
async function loadFlashSale() {
    try {
        const req = await fetch('data/promo.json');
        const promo = await req.json();
        
        if (!promo.active) return;

        const endDate = new Date(promo.date_fin).getTime();
        const banner = document.createElement('div');
        banner.style = `background:${promo.couleur}; color:white; padding:10px; text-align:center; font-weight:bold; position:sticky; top:0; z-index:1000; animation:slideDown 0.5s;`;
        banner.id = "promo-banner";
        document.body.prepend(banner);

        setInterval(() => {
            const now = new Date().getTime();
            const distance = endDate - now;

            if (distance < 0) {
                banner.style.display = 'none';
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            banner.innerHTML = `🔥 ${promo.titre} - Fin dans : ${hours}h ${minutes}m ${seconds}s 🔥`;
        }, 1000);
    } catch (e) {}
}

// --- 2. INSPIRATIONS (LOOKBOOK) ---
// Cette fonction cherche les fichiers dans data/looks (géré par le CMS)
async function loadLooks() {
    const container = document.getElementById('looks-container');
    if (!container) return;

    // Note: Sur un site statique sans générateur, lister un dossier est dur.
    // Astuce : On va lire un fichier index généré ou utiliser une liste manuelle
    // POUR SIMPLIFIER ICI : On suppose que vous utilisez l'admin pour remplir un JSON unique 'looks.json'
    // SI vous utilisez la config collection "folder" ci-dessus, il faut un script de build.
    // -> MODIFICATION RAPIDE : Changeons la config CMS pour un fichier unique pour que ce soit simple.
    
    // (Voir note en bas pour la correction Config CMS)
    try {
        const req = await fetch('data/looks.json'); 
        const data = await req.json();
        const looks = data.items || [];

        if (looks.length === 0) return;

        container.innerHTML = `<h2>Inspirations du moment</h2><div class="looks-grid"></div>`;
        const grid = container.querySelector('.looks-grid');

        looks.forEach(look => {
            grid.innerHTML += `
                <div class="look-card" data-aos="fade-up">
                    <img src="${look.image}" alt="${look.titre}">
                    <div class="look-info">
                        <h3>${look.titre}</h3>
                        <p>${look.description}</p>
                        <div class="look-products">
                            ${look.produits.map(prod => `<span class="tag">${prod}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {}
}

// --- 3. FAQ ACCORDÉON ---
async function loadFAQ() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    try {
        const req = await fetch('data/faq.json');
        const data = await req.json();
        
        if (data.items.length > 0) {
            let html = `<div class="faq-list">`;
            data.items.forEach(item => {
                html += `
                    <details class="faq-item">
                        <summary>${item.question}</summary>
                        <p>${item.reponse}</p>
                    </details>
                `;
            });
            html += `</div>`;
            container.innerHTML = html;
        }
    } catch (e) {}
}

// --- 4. POPUP VIP ---
async function loadPopupVIP() {
    try {
        const req = await fetch('data/popup.json');
        const config = await req.json();

        if (!config.active) return;
        if (sessionStorage.getItem('popupClosed')) return; // Ne pas remontrer si fermé

        setTimeout(() => {
            const popup = document.createElement('div');
            popup.className = 'vip-popup';
            popup.innerHTML = `
                <div class="vip-content">
                    <button class="vip-close">&times;</button>
                    <h3> ${config.titre}</h3>
                    <p>${config.texte}</p>
                    <a href="${config.lien}" target="_blank" class="btn">Rejoindre le Groupe WhatsApp</a>
                </div>
            `;
            document.body.appendChild(popup);

            popup.querySelector('.vip-close').addEventListener('click', () => {
                popup.remove();
                sessionStorage.setItem('popupClosed', 'true');
            });
        }, 8000); // Apparaît après 8 secondes
    } catch (e) {}
}
