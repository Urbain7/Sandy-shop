document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Lire la configuration
        const response = await fetch('data/design.json');
        if (!response.ok) return;
        const config = await response.json();

        // 2. Définir les Palettes (Seulement pour le mode CLAIR)
        const palettes = {
            'mode': {
                primary: '#d1a3a4',
                lightBg: '#f4f6f8', // Gris perle
                lightText: '#333333'
            },
            'cuisine': {
                primary: '#e67e22',
                lightBg: '#fff5e6', // Crème
                lightText: '#2c3e50'
            },
            'btp': {
                primary: '#007bff',
                lightBg: '#f0f8ff', // Bleu très pâle
                lightText: '#000000'
            },
            'nature': {
                primary: '#27ae60',
                lightBg: '#f1f8e9', // Vert très pâle
                lightText: '#1e3a1e'
            },
            'luxe': {
                // Le thème Luxe est spécial (Noir tout le temps)
                primary: '#d4af37',
                lightBg: '#111111', 
                lightText: '#f0f0f0',
                isDark: true 
            }
        };

        let selectedColors;

        // 3. Choix de la palette
        if (config.theme === 'perso') {
            selectedColors = {
                primary: config.couleur_perso || '#333',
                lightBg: '#f4f6f8',
                lightText: '#333'
            };
        } else {
            selectedColors = palettes[config.theme] || palettes['mode'];
        }

        // 4. Application des couleurs
        const root = document.documentElement;
        
        // A. La couleur principale (Boutons, Prix...) s'applique tout le temps
        root.style.setProperty('--accent-color', selectedColors.primary);
        root.style.setProperty('--btn-main-bg', selectedColors.primary);
        
        // B. Cas Spécial : Thème Luxe (Force le mode sombre)
        if (selectedColors.isDark) {
            document.documentElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark'); // On force la sauvegarde
            // On cache le bouton de switch car ce thème est uniquement sombre
            const toggleBtn = document.getElementById('theme-toggle');
            if(toggleBtn) toggleBtn.style.display = 'none';
        } 
        else {
            // C. Cas Normal : On définit les variables du mode CLAIR
            // On ne touche PAS à --background-color directement, on remplit une variable tampon
            root.style.setProperty('--theme-light-bg', selectedColors.lightBg);
            root.style.setProperty('--theme-light-text', selectedColors.lightText);
            
            // Si ce n'est pas le thème Luxe, on s'assure que le bouton switch est visible
            const toggleBtn = document.getElementById('theme-toggle');
            if(toggleBtn) toggleBtn.style.display = 'block';
        }

    } catch (e) {
        console.error("Erreur thème:", e);
    }
});
