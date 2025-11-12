document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // Fonction pour mettre à jour l'icône en fonction du thème
    const updateIcon = () => {
        if (document.documentElement.classList.contains('dark-mode')) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    };

    // Attache l'événement au clic sur le bouton
    themeToggle.addEventListener('click', () => {
        // Ajoute ou retire la classe 'dark-mode' de l'élément <html>
        document.documentElement.classList.toggle('dark-mode');

        // Sauvegarde le choix de l'utilisateur dans le localStorage
        if (document.documentElement.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
        updateIcon();
    });

    // Met à jour l'icône au chargement initial de la page
    updateIcon();
});
