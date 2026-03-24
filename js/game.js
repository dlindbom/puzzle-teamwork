// Puzzle Teamwork — Huvudloop & spelkoordinator

(function() {
    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');

    // Stäng av anti-aliasing för pixel-art
    ctx.imageSmoothingEnabled = false;

    var players = [];
    var moveCount = 0;
    var lastTime = 0;

    // Starta input
    setupInput(canvas);

    // Ladda banpaket, sedan visa meny
    LevelManager.loadAll(function() {
        GameState.transition('menu');
        requestAnimationFrame(gameLoop);
    });

    // --- Huvudloop ---

    function gameLoop(timestamp) {
        var dt = lastTime ? timestamp - lastTime : 16;
        lastTime = timestamp;
        GameState.update(dt);

        // Rensa canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Route baserat på tillstånd
        switch (GameState.current) {
            case 'loading':
                drawLoading();
                break;
            case 'menu':
                updateMenu();
                UI.drawMenu(ctx, canvas.width, canvas.height);
                break;
            case 'playing':
                updatePlaying(dt);
                drawPlaying(timestamp);
                break;
            case 'victory':
                updateVictory();
                drawVictory(timestamp);
                break;
        }

        // Touch-knappar (alltid överst)
        UI.drawTouch(ctx);

        // Rensa pressed-flaggor
        clearPressed();

        requestAnimationFrame(gameLoop);
    }

    // --- Loading ---

    function drawLoading() {
        Renderer.drawBackground(ctx, canvas.width, canvas.height);
        drawTextCentered(ctx, 'Laddar...', canvas.width / 2, canvas.height / 2,
            '24px monospace', PALETTE.textMuted);
    }

    // --- Meny ---

    function updateMenu() {
        var choice = UI.updateMenu();
        if (choice === 'start') {
            startLevel(0, 0);
        }
    }

    // --- Starta bana ---

    function startLevel(packIndex, levelIndex) {
        var level = LevelManager.loadLevel(packIndex, levelIndex);
        if (!level) return;

        // Rensa meny-klickregioner
        clearClickRegions();

        // Centrera kamera
        Camera.center(level.cols, level.rows, CONFIG.TILE_SIZE,
            canvas.width, canvas.height);

        // Skapa spelare
        players = [];
        if (level.spawns.p1) {
            players.push(new Player(0, level.spawns.p1.row, level.spawns.p1.col));
        }
        // P2 skapas i Fas 2 (lokal co-op) och Fas 3 (nätverk)
        // I Fas 1: bara P1

        moveCount = 0;
        GameState.transition('playing');
    }

    // --- Spel ---

    function updatePlaying(dt) {
        var level = LevelManager.currentLevel;
        if (!level) return;

        // Uppdatera spelareanimationer
        for (var i = 0; i < players.length; i++) {
            players[i].update(dt);
        }

        // Vänta tills animation är klar innan vi tar ny input
        var allReady = true;
        for (var i = 0; i < players.length; i++) {
            if (players[i].animProgress < 1) allReady = false;
        }

        if (!allReady) return;

        // Hantera input (P1: piltangenter)
        var moved = false;
        var dir = null;

        if (consumePressed('ArrowUp'))    dir = 'up';
        if (consumePressed('ArrowDown'))  dir = 'down';
        if (consumePressed('ArrowLeft'))  dir = 'left';
        if (consumePressed('ArrowRight')) dir = 'right';

        if (dir && players[0]) {
            moved = players[0].tryMove(dir, level, players);
            if (moved) {
                moveCount++;
                // Kolla exit
                checkVictory(level);
            }
        }
    }

    function checkVictory(level) {
        var allOnExit = true;
        for (var i = 0; i < players.length; i++) {
            if (!players[i].checkExit(level)) {
                allOnExit = false;
            }
        }
        if (allOnExit && players.length > 0) {
            GameState.transition('victory');
        }
    }

    function drawPlaying(timestamp) {
        var level = LevelManager.currentLevel;
        if (!level) return;

        Renderer.drawBackground(ctx, canvas.width, canvas.height);
        Renderer.drawGrid(ctx, level, timestamp);
        Renderer.drawPlayers(ctx, players);
        UI.drawHUD(ctx, canvas.width, canvas.height, level, moveCount);
    }

    // --- Vinst ---

    function goToNextLevel() {
        clearClickRegions();
        var next = LevelManager.nextLevel();
        if (next) {
            Camera.center(next.cols, next.rows, CONFIG.TILE_SIZE,
                canvas.width, canvas.height);
            players = [];
            if (next.spawns.p1) {
                players.push(new Player(0, next.spawns.p1.row, next.spawns.p1.col));
            }
            moveCount = 0;
            GameState.transition('playing');
        } else {
            GameState.transition('menu');
        }
    }

    function goToMenu() {
        clearClickRegions();
        GameState.transition('menu');
    }

    function updateVictory() {
        if (consumePressed('Enter') || consumePressed(' ')) {
            goToNextLevel();
        }
        if (consumePressed('Escape')) {
            goToMenu();
        }
        // Musklick
        if (UI._victoryClicked === 'next') {
            UI._victoryClicked = null;
            goToNextLevel();
        }
        if (UI._victoryClicked === 'back') {
            UI._victoryClicked = null;
            goToMenu();
        }
    }

    function drawVictory(timestamp) {
        var level = LevelManager.currentLevel;
        drawPlaying(timestamp);
        UI.drawVictory(ctx, canvas.width, canvas.height, moveCount,
            level && level.meta ? level.meta.par_moves : null);
    }
})();
