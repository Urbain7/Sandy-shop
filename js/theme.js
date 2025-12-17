document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    
    // 1. Initialisation des icônes au chargement
    updateIcons();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Basculer la classe sur <html>
            document.documentElement.classList.toggle('dark-mode');
            
            // Vérifier l'état actuel
            const isDarkMode = document.documentElement.classList.contains('dark-mode');
            
            // Sauvegarder le choix
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Mettre à jour les icônes
            updateIcons();
        });
    }

    // Gestion du menu mobile (Hamburger)
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('nav-mobile');

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
        });
        
        // Fermer le menu au clic sur un lien
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
            });
        });
    }
});

function updateIcons() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (sunIcon && moonIcon) {
        if (isDarkMode) {
            sunIcon.style.display = 'block';  // Affiche Soleil pour revenir en jour
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block'; // Affiche Lune pour passer en nuit
        }
    }
}
