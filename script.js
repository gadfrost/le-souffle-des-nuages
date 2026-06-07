window.addEventListener('load', () => {
    const canvas = document.getElementById('skyCanvas');
    const ctx = canvas.getContext('2d');

    // Configuration du paysage
    let grassBlades = [];
    const grassCount = 150; // Nombre de brins d'herbe
    let time = 0;           // Compteur pour animer le vent

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initGrass(); // On recrée l'herbe si l'écran change de taille
    }

    // Génération aléatoire des brins d'herbe sur la plaine
    function initGrass() {
        grassBlades = [];
        const plaineHeight = canvas.height - 100; // Hauteur de la plaine en bas

        for (let i = 0; i < grassCount; i++) {
            grassBlades.push({
                x: Math.random() * canvas.width,
                y: canvas.height - (Math.random() * 40), // Répartis sur le bas
                height: 30 + Math.random() * 25,         // Taille variable
                angle: 0,                                // Angle de départ
                speed: 0.02 + Math.random() * 0.03       // Vitesse d'oscillation
            });
        }
    }

    // Fonction principale de dessin et d'animation
    function animate() {
        // 1. Dessiner le ciel (un beau dégradé bleu)
        let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#4a90e2'); // Bleu ciel en haut
        skyGradient.addColorStop(0.7, '#a1c4fd'); // Bleu plus clair au milieu
        skyGradient.addColorStop(1, '#c2e9fb'); // Transition douce vers le bas
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Dessiner la plaine verte en fond
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height + 100, canvas.width * 0.8, 200, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Dessiner et animer l'herbe qui bouge au vent
        time += 0.02; // Le temps avance pour le calcul du vent
        ctx.strokeStyle = '#1e7e34';
        ctx.lineWidth = 2;

        grassBlades.forEach(blade => {
            // Utilisation de Math.sin pour créer un mouvement de va-et-vient fluide
            const wind = Math.sin(time + blade.x * 0.01) * 15;
            
            ctx.beginPath();
            ctx.moveTo(blade.x, blade.y);
            // On courbe le brin d'herbe vers le haut en ajoutant la force du vent
            ctx.quadraticCurveTo(
                blade.x, blade.y - blade.height / 2, 
                blade.x + wind, blade.y - blade.height
            );
            ctx.stroke();
        });

        // Relancer l'animation en boucle
        requestAnimationFrame(animate);
    }

    // Événements et initialisation
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
});
