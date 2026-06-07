window.addEventListener('load', () => {
    const canvas = document.getElementById('skyCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Un petit fond bleu de test pour voir si le canvas fonctionne
        ctx.fillStyle = '#87CEEB'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    console.log("Nouveau projet initialisé avec succès !");
});
