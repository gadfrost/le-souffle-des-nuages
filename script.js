window.addEventListener('load', () => {
    const canvas = document.getElementById('skyCanvas');
    const ctx = canvas.getContext('2d');
    const nameInput = document.getElementById('nameInput');
    const generateBtn = document.getElementById('generateBtn');

    // Configuration des éléments
    let grassBlades = [];
    const grassCount = 180;
    let backgroundClouds = []; 
    let cloudParticles = [];    
    let rainDrops = [];        // Particules de pluie
    let time = 0;              
    
    // GESTION DE LA MÉTÉO DYNAMIQUE
    // "sunny" (beau temps) ou "stormy" (orage)
    let currentWeather = "sunny"; 
    let weatherTimer = 0;
    let skyDarkness = 0;       // Transition fluide de l'obscurité du ciel (0 à 1)
    let lightningFlash = 0;    // Intensité de l'éclair (0 à 1)

    // Variables Audio Web autonomes
    let audioCtx = null;
    let windFilter = null;
    let windGain = null;
    let rainGain = null;
    let birdTimeout = null;

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
            const greens = ['#27ae60', '#2ecc71', '#1e8449', '#26a65b'];
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

    // 2. VRAIS NUAGES DE FOND MOUTONNEUX
    function initBackgroundClouds() {
        backgroundClouds = [];
        for (let i = 0; i < 4; i++) {
            backgroundClouds.push({
                x: Math.random() * canvas.width,
                y: 40 + Math.random() * 120,
                size: 30 + Math.random() * 25,
                speed: 0.2 + Math.random() * 0.2,
                // Couleur propre à chaque nuage pour la transition (blanc vers gris)
                grayScale: 255 
            });
        }
    }

    // Dessin d'un vrai nuage d'arrière-plan accumulé (plusieurs cercles imbriqués)
    function drawRealCloud(x, y, size, r, g, b, opacity) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.4, size * 1.1, 0, Math.PI * 2);
        ctx.arc(x + size * 1.3, y, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    // 3. MOTEUR AUDIO AUDIO-GÉNÉRÉ SYNCHRONISÉ
    function initAudio() {
        if (audioCtx) return; 
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const bufferSize = 2 * audioCtx.sampleRate;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        // --- LE VENT ---
        const windNoise = audioCtx.createBufferSource();
        windNoise.buffer = noiseBuffer;
        windNoise.loop = true;

        windFilter = audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.setValueAtTime(350, audioCtx.currentTime);

        windGain = audioCtx.createGain();
        windGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        windNoise.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(audioCtx.destination);
        windNoise.start();

        // Évolution organique du vent
        setInterval(() => {
            if (!audioCtx) return;
            // Si tempête, le vent souffle plus fort et plus aigu
            const baseFreq = currentWeather === "stormy" ? 400 : 200;
            const varFreq = currentWeather === "stormy" ? 400 : 200;
            const targetFreq = baseFreq + Math.random() * varFreq;
            
            const baseGain = currentWeather === "stormy" ? 0.15 : 0.05;
            const targetGain = baseGain + Math.random() * 0.08;

            windFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 1);
            windGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.8);
        }, 1500);

        // --- LA PLUIE (Bruit blanc filtré différemment) ---
        const rainNoise = audioCtx.createBufferSource();
        rainNoise.buffer = noiseBuffer;
        rainNoise.loop = true;

        const rainFilter = audioCtx.createBiquadFilter();
        rainFilter.type = 'highpass'; // Son plus cristallin pour les gouttes
        rainFilter.frequency.setValueAtTime(1200, audioCtx.currentTime);

        rainGain = audioCtx.createGain();
        rainGain.gain.setValueAtTime(0, audioCtx.currentTime); // Coupe au début

        rainNoise.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(audioCtx.destination);
        rainNoise.start();

        // Lancement de la boucle des oiseaux
        triggerBirdChirp();
    }

    // Chants d'oiseaux (S'arrêtent si météo = tempête)
    function triggerBirdChirp() {
        if (!audioCtx) return;
        
        // S'il pleut/tonne, les oiseaux se cachent et ne chantent plus !
        if (currentWeather === "sunny" && Math.random() > 0.2) {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            const baseFreq = 2600 + Math.random() * 700; 
            
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq + 500, now + 0.04);
            osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.12);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.02, now + 0.02); 
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        }

        // Planifier le prochain gazouillement
        const nextTime = currentWeather === "sunny" ? (3000 + Math.random() * 4000) : 2000;
        birdTimeout = setTimeout(triggerBirdChirp, nextTime);
    }

    // 4. LOGIQUE DU PRÉNOM (Reste toujours blanc et visible)
    function generateCloudName(text) {
        if (!text.trim()) return;
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        cloudParticles = []; 
        const isMobile = canvas.width < 768;
        
        let fontSize = isMobile ? (canvas.width / (text.length * 0.5)) : (canvas.width / (text.length * 0.7));
        fontSize = Math.min(Math.max(fontSize, 50), 120); 

        const textCanvas = document.createElement('canvas');
        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;
        const textCtx = textCanvas.getContext('2d');

        textCtx.font = `bold ${fontSize}px "Segoe UI", sans-serif`;
        textCtx.textBaseline = 'middle';
        textCtx.textAlign = 'center';
        
        textCtx.fillStyle = 'white';
        textCtx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height * 0.3);

        const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
        const gap = isMobile ? 4 : 5; 

        for (let y = 0; y < textCanvas.height; y += gap) {
            for (let x = 0; x < textCanvas.width; x += gap) {
                const index = (y * textCanvas.width + x) * 4;
                if (imageData.data[index + 3] > 128) {
                    const offsetX = x - (canvas.width / 2);
                    cloudParticles.push({
                        x: -250 + offsetX, 
                        y: y + (Math.random() * 4 - 2),
                        baseY: y,
                        size: 5 + Math.random() * 7,      
                        alpha: 0.28 + Math.random() * 0.25, 
                        vx: 1.4,                           
                        randomDrift: Math.random() * Math.PI
                    });
                }
            }
        }
    }

    // 5. BOUCLE D'ANIMATION PRINCIPALE (Météo + Rendu graphique)
    function animate() {
        // GESTION DU CYCLE DE MÉTÉO DYNAMIQUE (Change toutes les ~18 secondes)
        weatherTimer++;
        if (weatherTimer > 1100) {
            currentWeather = currentWeather === "sunny" ? "stormy" : "sunny";
            weatherTimer = 0;
        }

        // Transitions fluides des couleurs selon le mode météo
        if (currentWeather === "stormy") {
            if (skyDarkness < 1) skyDarkness += 0.005; // Assombrissement progressif
            if (rainGain && rainGain.gain.value < 0.12) rainGain.gain.value += 0.001; // La pluie augmente
        } else {
            if (skyDarkness > 0) skyDarkness -= 0.005; // Retour du soleil
            if (rainGain && rainGain.gain.value > 0) rainGain.gain.value -= 0.002; // La pluie s'arrête
        }

        // Gestion aléatoire des éclairs pendant l'orage
        if (currentWeather === "stormy" && Math.random() < 0.004 && lightningFlash === 0) {
            lightningFlash = 1; // Déclenche un flash d'éclair impulsionnel
        }
        if (lightningFlash > 0) lightningFlash -= 0.04; // Atténuation rapide de l'éclair

        // RENDU DU CIEL (S'adapte à la météo)
        // Interpolation entre bleu azur et gris d'orage
        let rSky = Math.floor(41 * (1 - skyDarkness) + 20 * skyDarkness);
        let gSky = Math.floor(128 * (1 - skyDarkness) + 28 * skyDarkness);
        let bSky = Math.floor(185 * (1 - skyDarkness) + 46 * skyDarkness);
        
        ctx.fillStyle = `rgb(${rSky}, ${gSky}, ${bSky})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Effet de Flash d'éclair sur tout le ciel
        if (lightningFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash * 0.6})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // DESSIN DES NUAGES DE FOND (Deviennent gris s'il y a orage)
        backgroundClouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x - cloud.size * 2 > canvas.width) {
                cloud.x = -cloud.size * 2;
                cloud.y = 40 + Math.random() * 120;
            }

            // Transition de la couleur du nuage (255=blanc pur, 85=gris foncé)
            let targetColor = currentWeather === "stormy" ? 85 : 255;
            cloud.grayScale += (targetColor - cloud.grayScale) * 0.01;

            drawRealCloud(cloud.x, cloud.y, cloud.size, cloud.grayScale, cloud.grayScale, cloud.grayScale, 0.4);
        });

        // GESTION ET DESSIN DE LA PLUIE
        if (currentWeather === "stormy" || rainDrops.length > 0) {
            // Ajouter de nouvelles gouttes si l'orage bat son plein
            if (currentWeather === "stormy" && rainDrops.length < 100) {
                rainDrops.push({
                    x: Math.random() * canvas.width,
                    y: -10,
                    length: 15 + Math.random() * 15,
                    speed: 10 + Math.random() * 6
                });
            }

            // Animer et dessiner les gouttes
            ctx.strokeStyle = 'rgba(174, 214, 241, 0.4)';
            ctx.lineWidth = 1.2;
            for (let i = rainDrops.length - 1; i >= 0; i--) {
                let drop = rainDrops[i];
                drop.y += drop.speed;
                drop.x += 1; // Légèrement inclinée par le vent

                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 1, drop.y + drop.length);
                ctx.stroke();

                // Supprimer la goutte si elle touche le sol
                if (drop.y > canvas.height - 80) {
                    rainDrops.splice(i, 1);
                }
            }
        }

        // ANIMATION DU NUAGE-PRÉNOM (Reste toujours blanc et pur !)
        time += 0.025;
        for (let i = cloudParticles.length - 1; i >= 0; i--) {
            let p = cloudParticles[i];
            p.x += p.vx; 
            p.y = p.baseY + Math.sin(time + p.x * 0.015 + p.randomDrift) * 2;

            if (p.x > canvas.width * 0.85) p.alpha -= 0.004;

            if (p.x > canvas.width + 300 || p.alpha <= 0) {
                cloudParticles.splice(i, 1);
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // COLLINES ET PAYSAGE (S'assombrissent légèrement sous la tempête)
        let hillDarkness = 1 - (skyDarkness * 0.35); // Perte de luminosité de 35% max
        
        // Colline lointaine
        ctx.fillStyle = `rgb(${Math.floor(30 * hillDarkness)}, ${Math.floor(132 * hillDarkness)}, ${Math.floor(73 * hillDarkness)})`;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 60);
        ctx.quadraticCurveTo(canvas.width * 0.3, canvas.height - 110, canvas.width, canvas.height - 50);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Colline principale
        ctx.fillStyle = `rgb(${Math.floor(39 * hillDarkness)}, ${Math.floor(174 * hillDarkness)}, ${Math.floor(96 * hillDarkness)})`;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 80);
        ctx.quadraticCurveTo(canvas.width * 0.65, canvas.height - 140, canvas.width, canvas.height - 75);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Dessin des brins d'herbe oscillants
        ctx.lineWidth = 1.8;
        grassBlades.forEach(blade => {
            ctx.strokeStyle = blade.color;
            // L'herbe s'agite un peu plus violemment sous l'orage
            const windStrength = currentWeather === "stormy" ? 15 : 9;
            const wind = Math.sin(time + blade.x * 0.02) * windStrength;
            
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
        if (e.key === 'Enter') generateBtn.click();
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
});
