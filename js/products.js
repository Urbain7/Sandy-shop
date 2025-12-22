document.addEventListener('DOMContentLoaded', () => {
    // --- ROUTAGE ---
    if (document.getElementById('product-list')) {
        initProduitsPage();
    }
    if (document.getElementById('cart-container')) {
        initPanierPage();
    }
    if (document.getElementById('product-detail-container')) {
        initProduitDetailPage();
    }
    
    // Affiliation (Sauvegarde du parrain si présent dans l'URL)
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) sessionStorage.setItem('affiliation_ref', ref);
});

// =================================================================
// 1. UTILITAIRES (Squelettes, Mélange, Couleurs)
// =================================================================

function displaySkeletonCards() {
    const list = document.getElementById('product-list');
    if(list) { list.innerHTML = ''; for(let i=0; i<8; i++) list.innerHTML += `<div class="product-card skeleton"><div class="skeleton-img"></div><div class="skeleton-text"></div></div>`; }
}

function shuffleArray(array) { 
    for (let i = array.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [array[i], array[j]] = [array[j], array[i]]; 
    } 
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// =================================================================
// 2. PAGE CATALOGUE
// =================================================================
async function initProduitsPage() {
    const productList = document.getElementById('product-list');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    displaySkeletonCards();

    try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const response = await fetch('data/produits.json');
        if (!response.ok) throw new Error('Fichier JSON introuvable');
        
        const data = await response.json();
        const rawProducts = data.items ? data.items : data;
        
        // --- LOGIQUE STARS ---
        const stars = rawProducts.filter(p => p.is_star === true);
        const others = rawProducts.filter(p => p.is_star !== true);
        shuffleArray(others);
        const allProducts = [...stars, ...others];

        // --- PAGINATION & FILTRES ---
        const ITEMS_PER_PAGE = 12; 
        let currentPage = 1;
        let currentFilteredProducts = [];

        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        const sortBy = document.getElementById('sort-by');
        
        const categories = [...new Set(allProducts.map(p => p.categorie))];
        categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>';
        categories.forEach(cat => categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`);

        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('categorie');
        if (initialCategory && categories.includes(initialCategory)) categoryFilter.value = initialCategory;

        function applyFilters() {
            let temp = [...allProducts];
            if (categoryFilter.value !== 'all') temp = temp.filter(p => p.categorie === categoryFilter.value);
            if (searchInput.value) temp = temp.filter(p => p.nom.toLowerCase().includes(searchInput.value.toLowerCase()));
            
            if (sortBy.value === 'price-asc') temp.sort((a,b) => a.prix - b.prix);
            if (sortBy.value === 'price-desc') temp.sort((a,b) => b.prix - a.prix);
            if (sortBy.value === 'name-asc') temp.sort((a,b) => a.nom.localeCompare(b.nom));
            if (sortBy.value === 'name-desc') temp.sort((a,b) => b.nom.localeCompare(a.nom));
            
            currentFilteredProducts = temp;
            currentPage = 1;
            productList.innerHTML = '';
            renderBatch();
        }

        function renderBatch() {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const batch = currentFilteredProducts.slice(start, end);

            if (batch.length === 0) { productList.innerHTML = '<p class="empty-grid-message">Aucun produit trouvé.</p>'; loadMoreContainer.style.display='none'; return; }

            batch.forEach(p => {
                const isOutOfStock = p.stock === 0;
                const starClass = p.is_star ? 'star-product' : '';
                const badge = p.is_star ? '<span class="star-badge">🌟 STAR</span>' : '';
                const btn = isOutOfStock ? `<button disabled class="btn out-of-stock-btn">Épuisé</button>` : `<button class="btn add-to-cart">Ajouter</button>`;
                
                // Logique Prix Promo
                let priceHTML = '';
                if (p.prix_original && p.prix_original > p.prix) {
                    priceHTML = `<div class="price-container"><span class="old-price">${formatPrice(p.prix_original)}</span><span class="promo-price">${formatPrice(p.prix)}</span></div>`;
                } else {
                    priceHTML = `<p class="product-price">${formatPrice(p.prix)}</p>`;
                }

                let html = `
                    <div class="product-card ${starClass} ${isOutOfStock ? 'out-of-stock' : ''}" data-aos="fade-up">
                        ${badge}
                        <a href="produit.html?id=${p.id}" class="product-link">
                            <img src="${p.image}" loading="lazy"><h3>${p.nom}</h3>
                        </a>
                        ${priceHTML}
                        <div class="product-actions" data-id="${p.id}">${btn}<button class="like-btn">❤️</button></div>
                    </div>`;
                
                if (p.stock > 0 && p.stock <= 3) html = html.replace(/<div class="price-container">|<p class="product-price">/, `<div class="stock-alert">🔥 Vite ! Plus que ${p.stock} !</div>$&`);
                
                productList.insertAdjacentHTML('beforeend', html);
            });
            
            loadMoreContainer.style.display = (end >= currentFilteredProducts.length) ? 'none' : 'block';
            addEventListenersToCards(allProducts);
            if (typeof AOS !== 'undefined') setTimeout(() => AOS.refresh(), 100);
        }

        categoryFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', () => setTimeout(applyFilters, 300));
        sortBy.addEventListener('change', applyFilters);
        loadMoreBtn.addEventListener('click', () => { currentPage++; renderBatch(); });

        applyFilters();
    } catch (e) { console.error(e); }
}

function addEventListenersToCards(allProducts) {
    document.querySelectorAll('.product-actions').forEach(actions => {
        if(actions.getAttribute('data-listening') === 'true') return;
        actions.setAttribute('data-listening', 'true');
        const productId = actions.dataset.id;
        
        const likeBtn = actions.querySelector('.like-btn');
        if (likeBtn) likeBtn.addEventListener('click', () => {
            let likes = JSON.parse(localStorage.getItem('likes')) || {};
            likes[productId] = !likes[productId];
            localStorage.setItem('likes', JSON.stringify(likes));
            likeBtn.classList.toggle('liked', likes[productId]);
        });

        const cartBtn = actions.querySelector('.add-to-cart');
        if (cartBtn) cartBtn.addEventListener('click', () => {
            const product = allProducts.find(p => p.id == productId);
            if (product) { 
                addToCart(product); 
                showToast("Ajouté au panier !");
                const originalText = cartBtn.innerHTML;
                cartBtn.innerHTML = '✔';
                cartBtn.disabled = true;
                setTimeout(() => { cartBtn.innerHTML = originalText; cartBtn.disabled = false; }, 2000);
            }
        });
    });
}

// =================================================================
// 3. PAGE DÉTAIL PRODUIT
// =================================================================
async function initProduitDetailPage() {
    const container = document.getElementById('product-detail-container');
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) return;

    try {
        const response = await fetch('data/produits.json');
        const data = await response.json();
        const allProducts = data.items ? data.items : data;
        const product = allProducts.find(p => p.id == productId);
        if (!product) return;

        document.title = `${product.nom} - Sandy'Shop`;
        const images = product.images && product.images.length > 0 ? product.images : [product.image];
        
        let audioHTML = product.audio ? `<div class="audio-player" style="margin:15px 0;background:#f9f9f9;padding:10px;border-radius:8px;"><p style="font-size:0.8rem;font-weight:bold;">🎧 Écouter la présentation :</p><audio controls style="width:100%"><source src="${product.audio}" type="audio/mpeg"></audio></div>` : '';
        let sizesHTML = product.tailles ? `<div class="product-sizes"><label>Taille :</label><div class="size-options">${product.tailles.split(',').map((s,i) => `<input type="radio" name="size" id="s${i}" value="${s.trim()}" ${i===0?'checked':''}><label for="s${i}" class="size-box">${s.trim()}</label>`).join('')}</div></div>` : '';

        // Prix Promo
        let priceHTML = '';
        if (product.prix_original && product.prix_original > product.prix) {
            priceHTML = `<div class="price-container"><span class="old-price">${formatPrice(product.prix_original)}</span><span class="promo-price">${formatPrice(product.prix)}</span></div>`;
        } else {
            priceHTML = `<p class="product-price">${formatPrice(product.prix)}</p>`;
        }

        container.innerHTML = `
            <div class="product-detail" data-aos="fade-in">
                <div class="product-gallery">
                    <div class="main-image-container" id="img-container"><img src="${product.image}" id="main-product-image" class="zoom-image"></div>
                    <div class="thumbnail-images">${images.map(img => `<img src="${img}">`).join('')}</div>
                </div>
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    ${priceHTML}
                    ${audioHTML}
                    ${sizesHTML}
                    <div class="product-options">
                        <label>Quantité :</label><input type="number" id="product-quantity" value="1" min="1" max="${product.stock||99}" style="width:60px; text-align:center;">
                    </div>
                    <p class="product-description">${product.description}</p>
                    ${product.stock > 0 ? '<button class="btn add-to-cart-detail">Ajouter au panier</button>' : '<button disabled class="btn out-of-stock-btn">Épuisé</button>'}
                    
                    <!-- BOUTONS ACTION -->
                    <div id="extra-buttons-container"></div>
                </div>
            </div>`;

        if (product.stock > 0 && product.stock <= 3) container.querySelector('h1').insertAdjacentHTML('afterend', `<div class="stock-alert">🔥 Vite ! Plus que ${product.stock} exemplaires !</div>`);

        // --- AFFILIATION & WHATSAPP ---
        const urlParams = new URLSearchParams(window.location.search);
        const promoCode = urlParams.get('promo');
        const refName = sessionStorage.getItem('affiliation_ref') || urlParams.get('ref');
        
        let waMsg = `Bonjour, je veux commander : ${product.nom}.`;
        if (promoCode) waMsg += `\n🎁 J'ai gagné le code promo : ${promoCode}`;
        if (refName) waMsg += `\n(Référé par : ${refName})`;
        waMsg += `\nEst-il disponible ?`;
        
        document.getElementById('extra-buttons-container').innerHTML = `
            <a href="https://wa.me/22893899538?text=${encodeURIComponent(waMsg)}" class="btn btn-whatsapp-order" target="_blank">
                Commander sur WhatsApp ${promoCode ? '(Promo 🎁)' : ''}
            </a>

            <!-- BOUTON CRÉER AFFICHE -->
            <button id="btn-poster" class="btn-poster">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Créer mon Affiche Pub
            </button>

            <div class="share-section" style="margin-top:10px;">
                <button id="native-share-btn" class="btn-secondary" style="width:100%">Partager ce produit</button>
            </div>`;

        // Activations
        setupProductInteractions(product, container);
        document.getElementById('btn-poster').addEventListener('click', () => generatePoster(product)); // Active le générateur d'affiche
        displayRecommendations(product, allProducts);
    } catch (e) { console.error(e); }
}

function setupProductInteractions(product, container) {
    const mainImg = document.getElementById('main-product-image');
    container.querySelectorAll('.thumbnail-images img').forEach(th => th.addEventListener('click', () => mainImg.src = th.src));
    
    const imgCont = document.getElementById('img-container');
    if (window.innerWidth > 768 && imgCont) {
        imgCont.addEventListener("mousemove", e => {
            const {left, top} = imgCont.getBoundingClientRect();
            mainImg.style.transformOrigin = `${e.clientX-left}px ${e.clientY-top}px`;
            mainImg.style.transform = "scale(2)";
        });
        imgCont.addEventListener("mouseleave", () => mainImg.style.transform = "scale(1)");
    }

    const shareBtn = document.getElementById('native-share-btn');
    if(shareBtn) shareBtn.addEventListener('click', async () => {
        try { if (navigator.share) await navigator.share({ title: product.nom, text: `Regarde ça : ${product.nom}`, url: window.location.href }); } catch {}
    });

    const btnCart = container.querySelector('.add-to-cart-detail');
    if(btnCart) btnCart.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('product-quantity').value);
        const size = container.querySelector('input[name="size"]:checked')?.value || '';
        const prodCart = { ...product, id: product.id + size, nom: product.nom + (size ? ` (${size})` : '') };
        addToCart(prodCart, qty);
        showToast("Ajouté au panier !");
        
        const originalText = btnCart.innerHTML;
        btnCart.innerHTML = 'Ajouté ✔';
        btnCart.disabled = true;
        setTimeout(() => { btnCart.innerHTML = originalText; btnCart.disabled = false; }, 2000);
    });
}

function displayRecommendations(currentProduct, allProducts) {
    const grid = document.getElementById('recommendations-grid');
    if (!grid) return;
    const recommended = allProducts.filter(p => p.categorie === currentProduct.categorie && p.id !== currentProduct.id).slice(0, 4);
    if (recommended.length > 0) {
        document.getElementById('recommendations-section').style.display = 'block';
        recommended.forEach(p => {
            grid.innerHTML += `<div class="product-card" data-aos="fade-up"><a href="produit.html?id=${p.id}" class="product-link"><img src="${p.image}"><h3>${p.nom}</h3></a><p class="product-price">${formatPrice(p.prix)}</p></div>`;
        });
    }
}

// =================================================================
// 4. PANIER & PDF
// =================================================================
async function initPanierPage() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;

    const renderCart = () => {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            cartContainer.innerHTML = '<p class="empty-grid-message">Votre panier est vide.</p>';
            document.getElementById('order-section').style.display = 'none';
            return;
        }
        document.getElementById('order-section').style.display = 'block';

        let totalProduits = cart.reduce((sum, item) => sum + (item.prix * item.quantity), 0);
        let summary = "";
        
        let html = `<table class="cart-items" data-aos="fade-up"><thead><tr><th>Produit</th><th>Prix</th><th>Qté</th><th>Total</th><th>Action</th></tr></thead><tbody>`;
        cart.forEach(item => {
            const lineTotal = item.prix * item.quantity;
            html += `<tr><td>${item.nom}</td><td>${formatPrice(item.prix)}</td><td><input type="number" class="cart-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99"></td><td>${formatPrice(lineTotal)}</td><td><button class="btn-secondary" onclick="removeFromCart('${item.id}');location.reload()">X</button></td></tr>`;
            summary += `• ${item.nom} x${item.quantity} : ${formatPrice(lineTotal)}\n`;
        });
        html += `</tbody></table>
        <div style="text-align:right; margin-top:20px;">
            <div style="font-size:1.5rem; color:var(--accent-color); font-weight:bold;">Total : ${formatPrice(totalProduits)}</div>
            <button id="btn-pdf" class="btn-secondary" style="margin-top:10px;">📄 Télécharger Facture</button>
        </div>`;

        cartContainer.innerHTML = html;
        document.getElementById('cart-content').value = summary;
        document.getElementById('cart-total').value = formatPrice(totalProduits);

        document.querySelectorAll('.cart-quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const pid = e.target.dataset.id;
                const qty = parseInt(e.target.value);
                if (qty > 0) { updateCartItemQuantity(pid, qty); renderCart(); }
            });
        });

        // PDF GENERATION (Optimisé)
        document.getElementById('btn-pdf').addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const rootStyles = getComputedStyle(document.documentElement);
            let siteColorHex = rootStyles.getPropertyValue('--accent-color').trim() || "#333333";
            const brandColor = hexToRgb(siteColorHex); 
            const black = [60, 60, 60];
            const shopName = document.querySelector('.logo') ? document.querySelector('.logo').innerText : "MA BOUTIQUE";

            const safeFormat = (val) => {
                let parts = val.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                let symbol = "FCFA";
                if(typeof SHOP_SETTINGS !== 'undefined' && SHOP_SETTINGS.currencySymbol) symbol = SHOP_SETTINGS.currencySymbol;
                return parts.join(".") + " " + symbol;
            };

            doc.setFillColor(...brandColor);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text(shopName.toUpperCase(), 105, 20, null, null, "center");

            doc.setTextColor(...black);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const clientName = document.getElementById('customer-name')?.value || "Client";
            
            doc.text("CLIENT : " + clientName, 15, 55);
            doc.text("Date : " + new Date().toLocaleDateString(), 140, 55);

            const tableRows = [];
            cart.forEach(item => {
                tableRows.push([item.nom, safeFormat(item.prix), String(item.quantity), safeFormat(item.prix * item.quantity)]);
            });

            doc.autoTable({
                head: [["Produit", "Prix", "Qté", "Total"]],
                body: tableRows,
                startY: 65,
                theme: 'striped',
                headStyles: { fillColor: brandColor, textColor: [255, 255, 255] }
            });

            let finalY = doc.lastAutoTable.finalY + 10;
            doc.setFillColor(...brandColor); 
            doc.rect(120, finalY + 5, 75, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`TOTAL : ${safeFormat(totalProduits)}`, 190, finalY + 13, null, null, "right");
            
            doc.save("facture.pdf");
        });
    };
    renderCart();

    const clearBtn = document.getElementById('clear-cart-btn');
    if(clearBtn) clearBtn.addEventListener('click', async () => {
        if(await showCustomConfirm("Vider le panier ?")) { localStorage.removeItem('cart'); renderCart(); }
    });

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = orderForm.querySelector('button');
            btn.textContent = "Envoi..."; btn.disabled = true;
            try {
                await fetch(orderForm.action, { method: 'POST', body: new FormData(orderForm), headers: { 'Accept': 'application/json' } });
                showToast("Commande envoyée !"); localStorage.removeItem('cart'); setTimeout(() => location.href="index.html", 1500);
            } catch { showToast("Erreur d'envoi."); btn.disabled = false; }
        });
    }
}

// =================================================================
// 5. GÉNÉRATEUR D'AFFICHE (CANVAS)
// =================================================================
async function generatePoster(product) {
    const btn = document.getElementById('btn-poster');
    const originalText = btn.innerHTML;
    btn.innerHTML = "🎨 Création...";
    btn.disabled = true;

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 1080; 
        canvas.width = size;
        canvas.height = size;

        // Fond Blanc
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        // Image Produit
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = `https://wsrv.nl/?url=${encodeURIComponent(product.image)}&w=800&output=jpg`;

        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

        // Dessin
        const scale = Math.min(800 / img.width, 800 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = 100;
        ctx.drawImage(img, x, y, w, h);

        // Cadre et Texte
        const rootStyles = getComputedStyle(document.documentElement);
        let siteColor = rootStyles.getPropertyValue('--accent-color').trim() || "#e67e22";
        
        ctx.strokeStyle = siteColor;
        ctx.lineWidth = 20;
        ctx.strokeRect(0, 0, size, size);

        ctx.textAlign = "center";
        
        // Nom
        ctx.fillStyle = "#333333";
        ctx.font = "bold 60px Arial";
        const name = product.nom.length > 30 ? product.nom.substring(0, 30) + "..." : product.nom;
        ctx.fillText(name, size / 2, 950);

        // Prix
        const price = formatPrice(product.prix);
        ctx.fillStyle = siteColor;
        ctx.font = "bold 90px Arial";
        ctx.fillText(price, size / 2, 850);

        // Badge
        ctx.fillStyle = "#111";
        ctx.fillRect(size / 2 - 250, 40, 500, 60);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 30px Arial";
        ctx.fillText("DISPONIBLE SUR EM AREA", size / 2, 82);

        // Download
        const link = document.createElement('a');
        link.download = `Affiche_${product.nom}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        showToast("Affiche téléchargée !");

    } catch (e) {
        console.error(e);
        showToast("Erreur image.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
