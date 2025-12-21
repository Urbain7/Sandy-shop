document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SYSTÈME D'AFFILIATION ---
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) sessionStorage.setItem('affiliation_ref', ref);

    // --- ROUTAGE ---
    if (document.getElementById('product-list')) initProduitsPage();
    if (document.getElementById('cart-container')) initPanierPage();
    if (document.getElementById('product-detail-container')) initProduitDetailPage();
});

// =================================================================
// FONCTIONS COMMUNES
// =================================================================
function displaySkeletonCards() {
    const list = document.getElementById('product-list');
    if(list) { list.innerHTML = ''; for(let i=0; i<8; i++) list.innerHTML += `<div class="product-card skeleton"><div class="skeleton-img"></div><div class="skeleton-text"></div></div>`; }
}
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } }

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
            if (product) { addToCart(product); showToast("Ajouté !"); }
        });
    });
}

// =================================================================
// PAGE CATALOGUE
// =================================================================
async function initProduitsPage() {
    const productList = document.getElementById('product-list');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    displaySkeletonCards();

    try {
        const response = await fetch('data/produits.json');
        const data = await response.json();
        const rawProducts = data.items ? data.items : data;
        
        // Stars + Mélange
        const stars = rawProducts.filter(p => p.is_star === true);
        const others = rawProducts.filter(p => p.is_star !== true);
        shuffleArray(others);
        const allProducts = [...stars, ...others];

        // Pagination & Filtres
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
            
            currentFilteredProducts = temp;
            currentPage = 1;
            productList.innerHTML = '';
            renderBatch();
        }

        function renderBatch() {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const batch = currentFilteredProducts.slice(start, end);

            if (batch.length === 0) { productList.innerHTML = '<p class="empty-grid-message">Aucun produit.</p>'; loadMoreContainer.style.display='none'; return; }

            batch.forEach(p => {
                const isOutOfStock = p.stock === 0;
                const starClass = p.is_star ? 'star-product' : '';
                const badge = p.is_star ? '<span class="star-badge">🌟 STAR</span>' : '';
                const btn = isOutOfStock ? `<button disabled class="btn out-of-stock-btn">Épuisé</button>` : `<button class="btn add-to-cart">Ajouter</button>`;
                
                let html = `
                    <div class="product-card ${starClass} ${isOutOfStock ? 'out-of-stock' : ''}" data-aos="fade-up">
                        ${badge}
                        <a href="produit.html?id=${p.id}" class="product-link">
                            <img src="${p.image}" loading="lazy"><h3>${p.nom}</h3>
                        </a>
                        <p class="product-price">${formatPrice(p.prix)}</p>
                        <div class="product-actions" data-id="${p.id}">${btn}<button class="like-btn">❤️</button></div>
                    </div>`;
                
                if (p.stock > 0 && p.stock <= 3) html = html.replace('<p class="product-price">', `<div class="stock-alert">🔥 Vite ! Plus que ${p.stock} !</div><p class="product-price">`);
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

// =================================================================
// PAGE DÉTAIL
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
        
        // Audio
        let audioHTML = product.audio ? `<div class="audio-player" style="margin:15px 0;background:#f9f9f9;padding:10px;border-radius:8px;"><p style="font-size:0.8rem;font-weight:bold;">🎧 Écouter la présentation :</p><audio controls style="width:100%"><source src="${product.audio}" type="audio/mpeg"></audio></div>` : '';

        // Tailles
        let sizesHTML = product.tailles ? `<div class="product-sizes"><label>Taille :</label><div class="size-options">${product.tailles.split(',').map((s,i) => `<input type="radio" name="size" id="s${i}" value="${s.trim()}" ${i===0?'checked':''}><label for="s${i}" class="size-box">${s.trim()}</label>`).join('')}</div></div>` : '';

        container.innerHTML = `
            <div class="product-detail" data-aos="fade-in">
                <div class="product-gallery">
                    <div class="main-image-container" id="img-container"><img src="${product.image}" id="main-product-image" class="zoom-image"></div>
                    <div class="thumbnail-images">${images.map(img => `<img src="${img}">`).join('')}</div>
                </div>
                <div class="product-info">
                    <h1>${product.nom}</h1>
                    <p class="product-price">${formatPrice(product.prix)}</p>
                    ${audioHTML}
                    ${sizesHTML}
                    <div class="product-options">
                        <label>Quantité :</label><input type="number" id="product-quantity" value="1" min="1" max="${product.stock||99}" style="width:60px; text-align:center;">
                    </div>
                    <p class="product-description">${product.description}</p>
                    ${product.stock > 0 ? '<button class="btn add-to-cart-detail">Ajouter au panier</button>' : '<button disabled class="btn out-of-stock-btn">Épuisé</button>'}
                    <div id="extra-buttons-container"></div>
                </div>
            </div>`;

        // Stock Faible
        if (product.stock > 0 && product.stock <= 3) container.querySelector('h1').insertAdjacentHTML('afterend', `<div class="stock-alert">🔥 Vite ! Plus que ${product.stock} exemplaires !</div>`);

        // WhatsApp + Affiliation
        const refName = sessionStorage.getItem('affiliation_ref');
        const refText = refName ? ` (Référé par: ${refName})` : '';
        const waMsg = `Bonjour, je veux commander : ${product.nom}${refText}. Est-il dispo ?`;
        
        document.getElementById('extra-buttons-container').innerHTML = `
            <a href="https://wa.me/22893899538?text=${encodeURIComponent(waMsg)}" class="btn btn-whatsapp-order" target="_blank">Commander sur WhatsApp</a>
            <div class="share-section" style="margin-top:10px;"><button id="native-share-btn" class="btn-secondary" style="width:100%">Partager ce produit</button></div>`;

        setupProductInteractions(product, container);
    } catch (e) { console.error(e); }
}

function setupProductInteractions(product, container) {
    const mainImg = document.getElementById('main-product-image');
    container.querySelectorAll('.thumbnail-images img').forEach(th => th.addEventListener('click', () => mainImg.src = th.src));
    
    // Zoom
    const imgCont = document.getElementById('img-container');
    if (window.innerWidth > 768 && imgCont) {
        imgCont.addEventListener("mousemove", e => {
            const {left, top} = imgCont.getBoundingClientRect();
            mainImg.style.transformOrigin = `${e.clientX-left}px ${e.clientY-top}px`;
            mainImg.style.transform = "scale(2)";
        });
        imgCont.addEventListener("mouseleave", () => mainImg.style.transform = "scale(1)");
    }

    // Partage
    const shareBtn = document.getElementById('native-share-btn');
    if(shareBtn) shareBtn.addEventListener('click', async () => {
        try { if (navigator.share) await navigator.share({ title: product.nom, text: `Regarde ça : ${product.nom}`, url: window.location.href }); } catch {}
    });

    // Panier
    const btnCart = container.querySelector('.add-to-cart-detail');
    if(btnCart) btnCart.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('product-quantity').value);
        const size = container.querySelector('input[name="size"]:checked')?.value || '';
        const prodCart = { ...product, id: product.id + size, nom: product.nom + (size ? ` (${size})` : '') };
        addToCart(prodCart, qty);
        showToast("Ajouté !");
    });
}

// =================================================================
// 4. PANIER (SANS LIVRAISON COMPLEXE)
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
        
        let html = `<table class="cart-items" data-aos="fade-up"><thead><tr><th>Produit</th><th>Prix</th><th>Qté</th><th>Total</th><th>Action</th></tr></thead><tbody>`;
        let summary = "";
        
        cart.forEach(item => {
            const lineTotal = item.prix * item.quantity;
            html += `<tr><td>${item.nom}</td><td>${formatPrice(item.prix)}</td><td><input type="number" class="cart-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1" max="99"></td><td>${formatPrice(lineTotal)}</td><td><button class="btn-secondary" onclick="removeFromCart('${item.id}');location.reload()">X</button></td></tr>`;
            summary += `• ${item.nom} x${item.quantity} : ${formatPrice(lineTotal)}\n`;
        });
        html += `</tbody></table>
        
        <div style="background:var(--card-bg-color); padding:15px; margin-top:20px; border-radius:8px; border:1px solid var(--card-border-color); text-align:right;">
            <p style="margin-bottom:5px;"><em>* Les frais de livraison seront calculés lors de la confirmation WhatsApp</em></p>
            <div style="font-size:1.5rem; color:var(--accent-color); font-weight:bold;">Total Produits : ${formatPrice(totalProduits)}</div>
        </div>
        
        <div style="text-align:right; margin-top:15px;">
            <button id="btn-pdf" class="btn-secondary" style="font-size:0.9rem;">📄 Télécharger ma Facture</button>
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

       // --- GÉNÉRATEUR DE FACTURE PRO ---
function generatePDF(cart, subtotal, deliverySelect) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Couleurs de la marque (Rose Poudré #d1a3a4 -> RGB: 209, 163, 164)
    const brandColor = [209, 163, 164]; 
    const black = [60, 60, 60];

    // --- 1. EN-TÊTE ---
    // Bande de couleur en haut
    doc.setFillColor(...brandColor);
    doc.rect(0, 0, 210, 40, 'F'); // Rectangle plein

    // Titre Blanc
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("SANDY'SHOP", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Facture & Récapitulatif de commande", 105, 30, null, null, "center");

    // --- 2. INFOS COMMANDE ---
    doc.setTextColor(...black);
    doc.setFontSize(10);
    
    // Date et Numéro
    const date = new Date().toLocaleDateString('fr-FR');
    const time = new Date().toLocaleTimeString('fr-FR');
    const orderId = "CMD-" + Math.floor(Math.random() * 100000); // Faux numéro unique

    doc.text(`Date : ${date} à ${time}`, 140, 50);
    doc.text(`Réf : ${orderId}`, 140, 55);

    // Infos Client (Récupérées du formulaire HTML si rempli)
    const clientName = document.getElementById('customer-name') ? document.getElementById('customer-name').value : "Client";
    const clientPhone = document.getElementById('customer-phone') ? document.getElementById('customer-phone').value : "";

    doc.setFont("helvetica", "bold");
    doc.text("CLIENT :", 15, 50);
    doc.setFont("helvetica", "normal");
    doc.text(clientName || "Client Invité", 15, 55);
    if(clientPhone) doc.text(`Tél : ${clientPhone}`, 15, 60);

    // --- 3. TABLEAU DES PRODUITS (AutoTable) ---
    const tableColumn = ["Produit", "Prix Unit.", "Qté", "Total"];
    const tableRows = [];

    cart.forEach(item => {
        const itemTotal = item.prix * item.quantity;
        const productData = [
            item.nom,
            formatPrice(item.prix),
            item.quantity,
            formatPrice(itemTotal)
        ];
        tableRows.push(productData);
    });

    // Configuration du tableau
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70, // Commence après les infos
        theme: 'striped', // Rayures gris/blanc
        headStyles: {
            fillColor: brandColor, // En-tête Rose
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            font: 'helvetica',
            fontSize: 10
        },
        columnStyles: {
            0: { cellWidth: 90 }, // La colonne produit est plus large
            3: { fontStyle: 'bold' } // Le total en gras
        }
    });

    // --- 4. TOTAUX ---
    // On récupère la position Y où le tableau s'est arrêté
    let finalY = doc.lastAutoTable.finalY + 10;

    const shipping = parseInt(deliverySelect.value) || 0;
    const shippingName = deliverySelect.options[deliverySelect.selectedIndex].text;
    const total = subtotal + shipping;

    // Cadre des totaux
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.5);
    doc.line(110, finalY, 200, finalY); // Ligne de séparation

    doc.setFontSize(11);
    doc.text(`Sous-total :`, 140, finalY + 10);
    doc.text(formatPrice(subtotal), 195, finalY + 10, null, null, "right");

    doc.text(`Livraison :`, 140, finalY + 17);
    doc.setFontSize(9);
    doc.text(`(${shippingName})`, 140, finalY + 21); // Nom du quartier
    doc.setFontSize(11);
    doc.text(formatPrice(shipping), 195, finalY + 17, null, null, "right");

    // Total final en gros
    doc.setFillColor(...brandColor);
    doc.rect(135, finalY + 28, 65, 12, 'F'); // Fond rose
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL : ${formatPrice(total)}`, 195, finalY + 36, null, null, "right");

    // --- 5. PIED DE PAGE ---
    doc.setTextColor(...black);
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    
    // Positionner tout en bas de la page (A4 = 297mm de haut)
    const pageHeight = doc.internal.pageSize.height;
    doc.text("Merci de votre confiance ! Sandy'Shop - Lomé, Togo", 105, pageHeight - 20, null, null, "center");
    doc.text("Contact : +228 93 89 95 38", 105, pageHeight - 15, null, null, "center");

    // Sauvegarde
    doc.save(`Facture_SandyShop_${orderId}.pdf`);
}
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
