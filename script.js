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
        for (let i = 0; i < 4; i++) {
            backgroundClouds.push({
                x: Math.random() * canvas.width,
                y: 50 + Math.random() * 120,
                size: 40 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }

    // 3. Dessiner un nuage stylisé (accumulations de cercles)
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

    // 4. Logique magique : Scanner le texte et générer le nuage-prénom
    function generateCloudName(text) {
        if (!text.trim()) return;
        cloudParticles = []; // On efface le nuage précédent

        const isMobile = canvas.width < 768;
        let fontSize = isMobile ? (canvas.width / (text.length * 0.6)) : (canvas.width / (text.length * 0.75));
        fontSize = Math.min(Math.max(fontSize, 40), 100); // Taille adaptée au ciel

        // Création du canvas invisible pour scanner les pixels
        const textCanvas = document.createElement('canvas');
        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;
        const textCtx = textCanvas.getContext('2d');

        textCtx.font = `bold ${fontSize}px sans-serif`;
        textCtx.textBaseline = 'middle';
        textCtx.textAlign = 'center';
        
        // On dessine le texte au centre vertical de la zone du ciel (vers le haut)
        textCtx.fillStyle = 'white';
        textCtx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height * 0.3);

        const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
        const gap = isMobile ? 5 : 7; // Densité du nuage

        for (let y = 0; y < textCanvas.height; y += gap) {
            for (let x = 0; x < textCanvas.width; x += gap) {
                const index = (y * textCanvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    
                    // Calcul de la position de départ (les particules naissent à gauche de l'écran)
                    // Mais gardent l'écart de leur cible pour reformer le prénom en arrivant
                    const offsetX = x - (canvas.width / 2);
                    
                    cloudParticles.push({
                        x: -150 + offsetX, // Départ groupé hors-écran à gauche
                        y: y + (Math.random() * 6 - 3),
                        targetX: x,        // Là où le prénom se forme parfaitement
                        startX: -150 + offsetX,
                        size: 6 + Math.random() * 10, // Particules de brume assez grosses
                        alpha: 0.15 + Math.random() * 0.25, // Douces et transparentes
                        vx: 1.5 + Math.random() * 0.8, // Vitesse de déplacement globale
                        driftY: (Math.random() * 2 - 1) * 0.05, // Flottement vertical
                        dissipation: 0.0001 + Math.random() * 0.0002 // Perte d'opacité lente
                    });
                }
            }
        }
    }

    // 5. Boucle principale d'animation
    function animate() {
        // Ciel en dégradé
        let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#4a90e2');
        skyGradient.addColorStop(0.6, '#a1c4fd');
        skyGradient.addColorStop(1, '#c2e9fb');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animation des nuages de fond
        backgroundClouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x - cloud.size * 2 > canvas.width) {
                cloud.x = -cloud.size * 2;
                cloud.y = 50 + Math.random() * 120;
            }
            drawCloudShape(cloud.x, cloud.y, cloud.size, 0.25);
        });

        // Animation et dessin du Nuage-Prénom
        cloudParticles.forEach((p, index) => {
            p.x += p.vx; // Avance vers la droite
            p.y += p.driftY; // Flotte doucement de haut en bas

            // Effet de déformation au vent : quand il dépasse le centre, il commence à se dissiper
            if (p.x > p.targetX) {
                p.x += Math.sin(time + p.y * 0.05) * 0.2; // Ondulation au vent
                p.alpha -= p.dissipation; // Le nuage s'évapore
            }

            // Supprimer la particule si elle est invisible ou hors écran
            if (p.alpha <= 0 || p.x > canvas.width + 100) {
                cloudParticles.splice(index, 1);
            } else {
                // Dessin d'une particule floue de brume
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

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
        time += 0.02;
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

    // Gestionnaires d'événements
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
