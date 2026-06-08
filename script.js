window.addEventListener('load', () => {
    const canvas = document.getElementById('skyCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    // Configuration avancée du paysage
    let grassBlades = [];
    const grassCount = 180;    // Plus d'herbe pour plus de densité
    let backgroundClouds = []; // Nuages décoratifs de fond
    let cloudParticles = [];    // Particules du prénom
    let time = 0;              // Compteur pour le vent

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initGrass();
        initBackgroundClouds();
    }

    // 1. Initialisation de l'herbe avec des teintes de vert variées pour le réalisme
    function initGrass() {
        grassBlades = [];
        for (let i = 0; i < grassCount; i++) {
            // Un mélange de vert prairie et de vert tendre
            const greens = ['#27ae60', '#2ecc71', '#1e824c', '#26a65b'];
            grassBlades.push({
                x: Math.random() * canvas.width,
                y: canvas.height - (Math.random() * 40),
                height: 20 + Math.random() * 25,
                color: greens[Math.floor(Math.random() * greens.length)],
                speed: 0.02 + Math.random() * 0.02,
                phase: Math.random() * Math.PI
            });
        }
    }

    // 2. Des nuages de fond plus réalistes (plusieurs tailles et couches)
    function initBackgroundClouds() {
        backgroundClouds = [];
        for (let i = 0; i < 5; i++) {
            backgroundClouds.push({
                x: Math.random() * canvas.width,
                y: 30 + Math.random() * 140,
                size: 25 + Math.random() * 35,
                speed: 0.1 + Math.random() * 0.15,
                opacity: 0.1 + Math.random() * 0.15 // Très légers pour donner de la profondeur
            });
        }
    }

    // Dessin d'un nuage de fond vaporeux
    function drawCloudShape(x, y, size, opacity) {
        ctx.fillStyle = `rgba(245, 247, 250, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y - size * 0.3, size * 1.2, 0, Math.PI * 2);
        ctx.arc(x + size * 1.1, y, size * 0.9, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y + size * 0.2, size * 0.8, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    // 3. LOGIQUE MAGIQUE : Le prénom naît à gauche (hors-écran) et traverse au vent
    function generateCloudName(text) {
        if (!text.trim()) return;
        cloudParticles = []; // Réinitialise le ciel pour le nouveau prénom

        const isMobile = canvas.width < 768;
        
        // Taille ajustable selon la longueur du prénom
        let fontSize = isMobile ? (canvas.width / (text.length * 0.5)) : (canvas.width / (text.length * 0.7));
        fontSize = Math.min(Math.max(fontSize, 50), 120); 

        // Canvas invisible pour capturer la forme parfaite du prénom
        const textCanvas = document.createElement('canvas');
        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;
        const textCtx = textCanvas.getContext('2d');

        textCtx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
        textCtx.textBaseline = 'middle';
        textCtx.textAlign = 'center';
        
        // On dessine le texte au centre horizontal temporairement pour le scanner
        textCtx.fillStyle = 'white';
        textCtx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height * 0.3);

        const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
        const gap = isMobile ? 4 : 5; // Échantillonnage serré pour une excellente lisibilité

        for (let y = 0; y < textCanvas.height; y += gap) {
            for (let x = 0; x < textCanvas.width; x += gap) {
                const index = (y * textCanvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    
                    // CORRECTION CLÉ : On calcule l'écart par rapport au centre de la forme
                    const offsetX = x - (canvas.width / 2);
                    
                    // Toutes les particules commencent groupées HORS-ÉCRAN à gauche (-250px)
                    // Mais elles mémorisent leur position relative (offsetX) pour garder le prénom intact
                    cloudParticles.push({
                        x: -250 + offsetX, 
                        y: y + (Math.random() * 4 - 2),
                        baseY: y,
                        offsetX: offsetX,
                        size: 5 + Math.random() * 7,      // Particules vaporeuses mais précises
                        alpha: 0.25 + Math.random() * 0.25, // Densité idéale pour rester visible
                        vx: 1.2,                           // Vitesse du vent constante pour tout le prénom
                        speedOffset: Math.random() * 0.15, // Très léger décalage pour le côté "nuage"
                        randomDrift: Math.random() * Math.PI
                    });
                }
            }
        }
    }

    // 4. Boucle d'animation principale (Le rendu visuel)
    function animate() {
        // Ciel : Un magnifique dégradé de l'aube/journée calme
        let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#1a5276');   // Bleu profond au sommet
        skyGradient.addColorStop(0.4, '#2980b9'); // Bleu azur
        skyGradient.addColorStop(0.7, '#a9dfbf'); // Une touche de lumière émeraude à l'horizon
        skyGradient.addColorStop(1, '#e8f8f5');   // Brume blanche juste au-dessus de la plaine
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dessin des nuages décoratifs de fond
        backgroundClouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x - cloud.size * 2 > canvas.width) {
                cloud.x = -cloud.size * 2;
                cloud.y = 30 + Math.random() * 140;
            }
            drawCloudShape(cloud.x, cloud.y, cloud.size, cloud.opacity);
        });

        // Animation du Nuage-Prénom
        time += 0.025;

        for (let i = cloudParticles.length - 1; i >= 0; i--) {
            let p = cloudParticles[i];

            // Le vent pousse uniformément le prénom vers la droite
            p.x += p.vx; 
            
            // Effet vaporeux / sexy : le nuage ondule très légèrement sans casser les lettres
            p.y = p.baseY + Math.sin(time + p.x * 0.015 + p.randomDrift) * 2;

            // Il commence à se dissiper doucement seulement quand il arrive tout à droite
            if (p.x > canvas.width * 0.85) {
                p.alpha -= 0.004;
            }

            // Suppression s'il sort complètement de l'écran
            if (p.x > canvas.width + 300 || p.alpha <= 0) {
                cloudParticles.splice(i, 1);
            } else {
                // Rendu des particules de brume
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 5. Un paysage plus retravaillé : Double colline pour donner du relief
        // Colline lointaine (plus sombre)
        ctx.fillStyle = '#1e8449';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 60);
        ctx.quadraticCurveTo(canvas.width * 0.3, canvas.height - 110, canvas.width, canvas.height - 50);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Colline principale (au premier plan)
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 80);
        ctx.quadraticCurveTo(canvas.width * 0.65, canvas.height - 140, canvas.width, canvas.height - 75);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Dessin des brins d'herbe multicolores oscillants
        ctx.lineWidth = 1.8;
        grassBlades.forEach(blade => {
            ctx.strokeStyle = blade.color;
            // Force du vent liée au temps pour un balancement naturel
            const wind = Math.sin(time + blade.x * 0.02) * 10;
            
            ctx.beginPath();
            ctx.moveTo(blade.x, blade.y);
            ctx.quadraticCurveTo(
                blade.x, blade.y - blade.height / 2, 
                blade.x + wind, blade.y - blade.height
            );
            ctx.stroke();
        });

        requestAnimationFrame(animate);
    }

    // Événements d'envoi du prénom
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
