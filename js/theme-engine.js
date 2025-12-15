document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Lire la configuration depuis le fichier JSON
        const response = await fetch('data/design.json');
        if (!response.ok) return;
        const config = await response.json();

        // 2. Définir les Palettes de Couleurs (Hexadécimal)
        const palettes = {
            'mode': {
                primary: '#d1a3a4',   // Rose poudré
                bg: '#f4f6f8',        // Gris perle
                text: '#333333'
            },
            'cuisine': {
                primary: '#e67e22',   // Orange vif
                bg: '#fff5e6',        // Crème
                text: '#2c3e50'
            },
            'btp': {
                primary: '#007bff',   // Bleu chantier
                bg: '#f0f8ff',        // Bleu très pâle
                text: '#000000'
            },
            'nature': {
                primary: '#27ae60',   // Vert feuille
                bg: '#f1f8e9',        // Vert très pâle
                text: '#1e3a1e'
            },
            'luxe': {
                primary: '#d4af37',   // Or
                bg: '#111111',        // Noir (Mode sombre forcé)
                text: '#f0f0f0'
            }
        };

        let selectedColors;

        // 3. Appliquer le choix
        if (config.theme === 'perso') {
            // Si mode personnalisé
            selectedColors = {
                primary: config.couleur_perso || '#333',
                bg: '#f4f6f8',
                text: '#333'
            };
        } else {
            // Si pré-réglage
            selectedColors = palettes[config.theme] || palettes['mode'];
        }

        // 4. Injecter les couleurs dans le CSS du site
        const root = document.documentElement;
        
        // Couleur d'accent (Boutons, Prix, Titres)
        root.style.setProperty('--accent-color', selectedColors.primary);
        root.style.setProperty('--btn-main-bg', selectedColors.primary);
        
        // Cas spécial pour le thème Luxe (Fond noir)
        if (config.theme === 'luxe') {
            root.style.setProperty('--background-color', '#111');
            root.style.setProperty('--card-bg-color', '#222');
            root.style.setProperty('--text-color', '#fff');
            root.style.setProperty('--card-border-color', '#333');
            root.classList.add('dark-mode'); // Force les icônes en blanc
        } else {
            // Thèmes clairs normaux
            root.style.setProperty('--background-color', selectedColors.bg);
            root.style.setProperty('--text-color', selectedColors.text);
            root.style.setProperty('--card-bg-color', '#ffffff');
            root.classList.remove('dark-mode');
        }

    } catch (e) {
        console.error("Erreur chargement thème:", e);
    }
});
