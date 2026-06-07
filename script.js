window.addEventListener('load', () => {
    const canvas = document.getElementById('skyCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    // Configuration des éléments
    let grassBlades = [];
    const grassCount = 120;
    let backgroundClouds = []; // Nuages de fond
    let cloudParticles = [];    // Particules du prénom
    let time = 0;              // Compteur pour le vent

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initGrass();
        initBackgroundClouds();
    }

    // 1. Initialisation de l'herbe
    function initGrass() {
        grassBlades = [];
        for (let i = 0; i < grassCount; i++) {
            grassBlades.push({
                x: Math.random() * canvas.width,
                y: canvas.height - (Math.random() * 30),
                height: 25 + Math.random() * 20,
                speed: 0.02 + Math.random() * 0.02,
                phase: Math.random() * Math.PI
            });
        }
    }

    // 2. Initialisation des nuages de fond
    function initBackgroundClouds() {
        backgroundClouds = [];
        for (let i = 0; i < 3; i++) {
            backgroundClouds.push({
                x: Math.random() * canvas.width,
                y: 40 + Math.random() * 100,
                size: 35 + Math.random() * 35,
                speed: 0.15 + Math.random() * 0.2
            });
        }
    }

    // Dessiner un nuage décoratif en arrière-plan
    function drawCloudShape(x, y, size, opacity) {
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.4, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.2, y, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y + size * 0.2, size * 0.6, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    // 3. GÉNÉRATION DU PRÉNOM : Apparaît directement avec la bonne forme !
    function generateCloudName(text) {
        if (!text.trim()) return;
        cloudParticles = []; // On efface le nuage précédent pour le nouveau souffle

        const isMobile = canvas.width < 768;
        
        // Taille de police bien proportionnée
        let fontSize = isMobile ? (canvas.width / (text.length * 0.55)) : (canvas.width / (text.length * 0.75));
        fontSize = Math.min(Math.max(fontSize, 45), 110); 

        // Création du canvas invisible
        const textCanvas = document.createElement('canvas');
        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;
        const textCtx = textCanvas.getContext('2d');

        textCtx.font = `bold ${fontSize}px sans-serif`;
        textCtx.textBaseline = 'middle';
        textCtx.textAlign = 'center';
        
        // On dessine le texte au début de l'écran (à gauche) pour qu'il ait toute la place de défiler
        const startX = isMobile ? canvas.width * 0.3 : canvas.width * 0.25;
        const startY = canvas.height * 0.3; // Hauteur dans le ciel

        textCtx.fillStyle = 'white';
        textCtx.fillText(text.toUpperCase(), startX, startY);

        const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
        
        // Un gap plus serré (3 ou 4) permet de mieux voir les détails des lettres !
        const gap = isMobile ? 4 : 5; 

        for (let y = 0; y < textCanvas.height; y += gap) {
            for (let x = 0; x < textCanvas.width; x += gap) {
                const index = (y * textCanvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    
                    cloudParticles.push({
                        x: x, // Position X exacte du pixel : la forme est parfaite tout de suite !
                        y: y + (Math.random() * 4 - 2), // Un tout petit peu de relief
                        size: 4 + Math.random() * 6,   // Particules plus fines pour des lettres nettes
                        alpha: 0.2 + Math.random() * 0.3, // Brume douce mais bien visible
                        vx: 0.6 + Math.random() * 0.4,   // Vitesse du vent globale et homogène
                        driftY: Math.sin(x) * 0.05,       // Flottement très léger
                        baseY: y
                    });
                }
            }
        }
    }

    // 4. Boucle principale d'animation
    function animate() {
        // Ciel en dégradé
        let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#4a90e2');
        skyGradient.addColorStop(0.6, '#a1c4fd');
        skyGradient.addColorStop(1, '#c2e9fb');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Nuages décoratifs de fond
        backgroundClouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x - cloud.size * 2 > canvas.width) {
                cloud.x = -cloud.size * 2;
                cloud.y = 40 + Math.random() * 100;
            }
            drawCloudShape(cloud.x, cloud.y, cloud.size, 0.2);
        });

        // Animation du Nuage-Prénom
        time += 0.02;

        for (let i = cloudParticles.length - 1; i >= 0; i--) {
            let p = cloudParticles[i];

            p.x += p.vx; // Le vent pousse le nuage vers la droite
            
            // Effet de ondulation naturelle du vent sans détruire la forme de la lettre
            p.y = p.baseY + Math.sin(time + p.x * 0.02) * 4; 

            // Évaporation très lente uniquement quand il commence à sortir de l'écran à droite
            if (p.x > canvas.width * 0.8) {
                p.alpha -= 0.002;
            }

            // Supprimer uniquement s'il est totalement sorti ou invisible
            if (p.x > canvas.width + 50 || p.alpha <= 0) {
                cloudParticles.splice(i, 1);
            } else {
                // Dessin de la particule de texte
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Dessin de la plaine verte
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 80);
        ctx.quadraticCurveTo(canvas.width / 2, canvas.height - 130, canvas.width, canvas.height - 80);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Animation de l'herbe au vent
        ctx.strokeStyle = '#1e7e34';
        ctx.lineWidth = 2;
        grassBlades.forEach(blade => {
            const wind = Math.sin(time + blade.x * 0.015) * 12;
            ctx.beginPath();
            ctx.moveTo(blade.x, blade.y);
            ctx.quadraticCurveTo(blade.x, blade.y - blade.height / 2, blade.x + wind, blade.y - blade.height);
            ctx.stroke();
        });

        requestAnimationFrame(animate);
    }

    // Événements
    generateBtn.addEventListener('click', () => {
        generateCloudName(nameInput.value);
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
});
