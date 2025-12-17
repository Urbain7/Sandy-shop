document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Lire la config
        const response = await fetch('data/design.json');
        if (!response.ok) return;
        const config = await response.json();

        // 2. Définition des Palettes
        const palettes = {
            'mode': { primary: '#d1a3a4', bg: '#f4f6f8', card: '#ffffff', text: '#333333' },
            'cuisine': { primary: '#e67e22', bg: '#fff8f0', card: '#ffffff', text: '#2d3436' },
            'btp': { primary: '#0984e3', bg: '#f0f4f8', card: '#ffffff', text: '#2d3436' },
            'nature': { primary: '#27ae60', bg: '#f1f8e9', card: '#ffffff', text: '#1e3a1e' },
            'luxe': { primary: '#d4af37', bg: '#111', card: '#222', text: '#fff', isDark: true },
            'perso': { 
                primary: config.couleur_perso || '#333', 
                bg: '#f4f6f8', 
                card: '#ffffff', 
                text: '#333' 
            }
        };

        const theme = palettes[config.theme] || palettes['mode'];
        const root = document.documentElement;

        // 3. Application de la couleur principale
        root.style.setProperty('--theme-primary', theme.primary);

        // 4. Cas spécial : Thème Luxe (Force le Noir)
        if (theme.isDark) {
            root.classList.add('dark-mode');
            // On ne sauvegarde PAS 'dark' dans le localStorage ici pour ne pas bloquer l'utilisateur
            // s'il change de thème plus tard. On cache juste le bouton.
            const toggleBtn = document.getElementById('theme-toggle');
            if(toggleBtn) toggleBtn.style.display = 'none';
        } 
        else {
            // 5. Thèmes normaux : On définit les couleurs TAMPO
            root.style.setProperty('--theme-light-bg', theme.bg);
            root.style.setProperty('--theme-light-card', theme.card);
            root.style.setProperty('--theme-light-text', theme.text);
            
            // C'EST ICI LA CORRECTION :
            // On a supprimé la ligne "root.classList.remove('dark-mode')"
            // On laisse le fichier js/theme.js décider s'il faut le mode sombre ou pas.
            
            const toggleBtn = document.getElementById('theme-toggle');
            if(toggleBtn) toggleBtn.style.display = 'block';
        }

    } catch (e) {
        console.error("Erreur thème:", e);
    }
});
