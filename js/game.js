// Puzzle Teamwork — Huvudloop & spelkoordinator

(function() {
    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var players = [];
    var moveCount = 0;
    var lastTime = 0;

    // Tursystem
    var turnPhase = 'waiting'; // 'waiting', 'p1_chosen', 'both_chosen', 'resolving', 'animating'
    var p1Input = null;
    var p2Input = null;

    // Spelläge
    var gameMode = 'solo'; // 'solo', 'local', 'host', 'guest'

    setupInput(canvas);

    LevelManager.loadAll(function() {
        GameState.transition('menu');
        requestAnimationFrame(gameLoop);
    });

    // --- Huvudloop ---

    function gameLoop(timestamp) {
        var dt = lastTime ? timestamp - lastTime : 16;
        lastTime = timestamp;
        GameState.update(dt);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (GameState.current) {
            case 'loading':
                drawLoading();
                break;
            case 'menu':
                updateMenu();
                UI.drawMenu(ctx, canvas.width, canvas.height, gameMode);
                break;
            case 'lobby':
                updateLobby();
                UI.drawLobby(ctx, canvas.width, canvas.height);
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

        UI.drawTouch(ctx);
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
        if (choice === 'online_host') {
            gameMode = 'host';
            Network.createRoom(function() {
                GameState.transition('lobby');
            });
        } else if (choice === 'online_join') {
            gameMode = 'guest';
            UI.showJoinInput = true;
            // UI hanterar kodinmatning, sedan anropar joinWithCode()
        } else if (choice === 'join_confirm') {
            var code = UI.joinCode.toUpperCase().trim();
            if (code.length === 4) {
                UI.showJoinInput = false;
                Network.joinRoom(code, function(success) {
                    if (success) {
                        GameState.transition('lobby');
                    }
                });
            }
        } else if (choice === 'solo') {
            gameMode = 'solo';
            startLevel(0, 0);
        }
    }

    // --- Lobby ---

    function updateLobby() {
        if (Network.connected) {
            if (gameMode === 'host') {
                // Host startar spelet när båda är redo
                if (GameState.stateTimer > 1000) {
                    var level = startLevel(0, 0);
                    if (level) {
                        Network.send({ type: 'start_level', levelPack: 0, levelIndex: 0 });
                    }
                }
            }
        }

        // Hantera nätverksmeddelanden
        processNetworkMessages();

        if (consumePressed('Escape')) {
            Network.disconnect();
            gameMode = 'solo';
            GameState.transition('menu');
        }
    }

    // --- Starta bana ---

    function startLevel(packIndex, levelIndex) {
        var level = LevelManager.loadLevel(packIndex, levelIndex);
        if (!level) return null;

        clearClickRegions();
        Camera.center(level.cols, level.rows, CONFIG.TILE_SIZE,
            canvas.width, canvas.height);

        players = [];
        if (level.spawns.p1) {
            players.push(new Player(0, level.spawns.p1.row, level.spawns.p1.col));
        }
        if (level.spawns.p2 && gameMode !== 'solo') {
            players.push(new Player(1, level.spawns.p2.row, level.spawns.p2.col));
        }

        moveCount = 0;
        turnPhase = 'waiting';
        p1Input = null;
        p2Input = null;
        GameState.transition('playing');
        return level;
    }

    // --- Spel ---

    function updatePlaying(dt) {
        var level = LevelManager.currentLevel;
        if (!level) return;

        processNetworkMessages();

        // Uppdatera animationer
        for (var i = 0; i < players.length; i++) {
            players[i].update(dt);
        }

        // Kolla om animation är klar
        if (turnPhase === 'animating') {
            var allDone = true;
            for (var i = 0; i < players.length; i++) {
                if (players[i].animProgress < 1) allDone = false;
            }
            if (allDone) {
                // Kolla knappar/dörrar efter flytt
                updateButtonsAndDoors(level);
                checkVictory(level);
                if (GameState.current === 'playing') {
                    turnPhase = 'waiting';
                    p1Input = null;
                    p2Input = null;
                }
            }
            return;
        }

        if (turnPhase === 'resolving') return;

        // Solo-läge: direkt rörelse (ingen tur)
        if (gameMode === 'solo' && players.length === 1) {
            var dir = getDirectionInput();
            if (dir) {
                var moved = players[0].tryMove(dir, level, players);
                if (moved) {
                    moveCount++;
                    turnPhase = 'animating';
                }
            }
            return;
        }

        // Co-op tursystem (lokal eller nätverk)
        handleCoopTurn(level);
    }

    function getDirectionInput() {
        // Piltangenter + WASD
        if (consumePressed('ArrowUp')    || consumePressed('w') || consumePressed('W')) return 'up';
        if (consumePressed('ArrowDown')  || consumePressed('s') || consumePressed('S')) return 'down';
        if (consumePressed('ArrowLeft')  || consumePressed('a') || consumePressed('A')) return 'left';
        if (consumePressed('ArrowRight') || consumePressed('d') || consumePressed('D')) return 'right';
        return null;
    }

    function getP2DirectionLocal() {
        // IJKL för P2 i lokal co-op
        if (consumePressed('i') || consumePressed('I')) return 'up';
        if (consumePressed('k') || consumePressed('K')) return 'down';
        if (consumePressed('j') || consumePressed('J')) return 'left';
        if (consumePressed('l') || consumePressed('L')) return 'right';
        return null;
    }

    function handleCoopTurn(level) {
        var isMyP1 = (gameMode !== 'guest');  // Host och lokal = P1
        var isMyP2 = (gameMode === 'local' || gameMode === 'guest');

        // P1 input
        if (!p1Input && isMyP1) {
            var dir1 = getDirectionInput();
            if (dir1) {
                p1Input = dir1;
                if (gameMode === 'host') {
                    // Vänta på gästens input
                }
            }
        }

        // P2 input
        if (!p2Input && isMyP2) {
            var dir2;
            if (gameMode === 'local') {
                dir2 = getP2DirectionLocal();
            } else {
                // Guest: pilar styr P2
                dir2 = getDirectionInput();
            }
            if (dir2) {
                p2Input = dir2;
                if (gameMode === 'guest') {
                    Network.send({ type: 'input', dir: dir2 });
                }
            }
        }

        // Kolla om vi har båda
        var hasBoth = p1Input && p2Input;

        // I nätverksläge skickar host vidare om gästen inte vet
        if (hasBoth && (gameMode === 'local' || gameMode === 'host')) {
            resolveTurn(level);
        }
    }

    function resolveTurn(level) {
        turnPhase = 'resolving';

        // Lösa knappar först — avaktivera alla
        deactivateAllButtons(level);

        // Försök flytta båda
        var p1Moved = false;
        var p2Moved = false;

        if (players[0] && p1Input) {
            p1Moved = players[0].tryMove(p1Input, level, players);
        }
        if (players[1] && p2Input) {
            p2Moved = players[1].tryMove(p2Input, level, players);
        }

        if (p1Moved || p2Moved) {
            moveCount++;
        }

        turnPhase = 'animating';

        // Synka state till gäst
        if (gameMode === 'host') {
            Network.send({
                type: 'state_sync',
                players: players.map(function(p) {
                    return { row: p.row, col: p.col, prevRow: p.prevRow, prevCol: p.prevCol, facing: p.facing };
                }),
                moveCount: moveCount,
                grid: serializeGridState(level),
                p1Input: p1Input,
                p2Input: p2Input
            });
        }
    }

    function updateButtonsAndDoors(level) {
        // Avaktivera alla knappar
        deactivateAllButtons(level);

        // Aktivera knappar som spelare står på
        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            var cell = level.grid[p.row][p.col];
            if (cell.char === 'B') {
                cell.state.pressed = true;
                // Öppna länkade dörrar
                var key = p.row + ',' + p.col;
                if (level.links[key]) {
                    for (var j = 0; j < level.links[key].length; j++) {
                        var target = level.links[key][j].split(',');
                        var tr = parseInt(target[0]);
                        var tc = parseInt(target[1]);
                        if (level.grid[tr] && level.grid[tr][tc]) {
                            level.grid[tr][tc].state.open = true;
                        }
                    }
                }
            }
        }
    }

    function deactivateAllButtons(level) {
        for (var r = 0; r < level.grid.length; r++) {
            for (var c = 0; c < level.grid[r].length; c++) {
                var cell = level.grid[r][c];
                if (cell.char === 'B') cell.state.pressed = false;
                if (cell.char === 'D') cell.state.open = false;
            }
        }
    }

    function serializeGridState(level) {
        var states = {};
        for (var r = 0; r < level.grid.length; r++) {
            for (var c = 0; c < level.grid[r].length; c++) {
                var cell = level.grid[r][c];
                if (cell.state && Object.keys(cell.state).length > 0) {
                    states[r + ',' + c] = cell.state;
                }
            }
        }
        return states;
    }

    function checkVictory(level) {
        if (players.length === 0) return;
        var allOnExit = true;
        for (var i = 0; i < players.length; i++) {
            if (!players[i].checkExit(level)) {
                allOnExit = false;
            }
        }
        if (allOnExit) {
            clearClickRegions();
            GameState.transition('victory');
            if (gameMode === 'host') {
                Network.send({ type: 'level_complete', moveCount: moveCount });
            }
        }
    }

    function drawPlaying(timestamp) {
        var level = LevelManager.currentLevel;
        if (!level) return;

        Renderer.drawBackground(ctx, canvas.width, canvas.height);
        Renderer.drawGrid(ctx, level, timestamp);
        Renderer.drawPlayers(ctx, players);
        UI.drawHUD(ctx, canvas.width, canvas.height, level, moveCount);

        // Tur-indikator i co-op
        if (gameMode !== 'solo' && players.length > 1 && turnPhase === 'waiting') {
            var w = canvas.width;
            var h = canvas.height;
            if (!p1Input) {
                drawTextCentered(ctx, 'P1: ' + t('yourTurn'), w * 0.25, h - 20,
                    '14px monospace', PALETTE.p1);
            } else {
                drawTextCentered(ctx, 'P1: ✓', w * 0.25, h - 20,
                    '14px monospace', PALETTE.p1);
            }
            if (!p2Input) {
                drawTextCentered(ctx, 'P2: ' + t('yourTurn'), w * 0.75, h - 20,
                    '14px monospace', PALETTE.p2);
            } else {
                drawTextCentered(ctx, 'P2: ✓', w * 0.75, h - 20,
                    '14px monospace', PALETTE.p2);
            }
        }

        // Nätverksstatus
        if (gameMode === 'host' || gameMode === 'guest') {
            var statusColor = Network.connected ? '#22c55e' : PALETTE.textWarn;
            var statusText = Network.connected ? '● Online' : '● Tappad';
            drawText(ctx, statusText, 10, canvas.height - 10, '12px monospace', statusColor);
        }
    }

    // --- Vinst ---

    function goToNextLevel() {
        clearClickRegions();
        var next = LevelManager.nextLevel();
        if (next) {
            Camera.center(next.cols, next.rows, CONFIG.TILE_SIZE,
                canvas.width, canvas.height);
            players = [];
            if (next.spawns.p1) players.push(new Player(0, next.spawns.p1.row, next.spawns.p1.col));
            if (next.spawns.p2 && gameMode !== 'solo') players.push(new Player(1, next.spawns.p2.row, next.spawns.p2.col));
            moveCount = 0;
            turnPhase = 'waiting';
            p1Input = null;
            p2Input = null;
            GameState.transition('playing');
            if (gameMode === 'host') {
                Network.send({ type: 'start_level', levelPack: LevelManager.currentPackIndex, levelIndex: LevelManager.currentLevelIndex });
            }
        } else {
            GameState.transition('menu');
        }
    }

    function goToMenu() {
        clearClickRegions();
        Network.disconnect();
        gameMode = 'solo';
        GameState.transition('menu');
    }

    function updateVictory() {
        if (consumePressed('Enter') || consumePressed(' ')) goToNextLevel();
        if (consumePressed('Escape')) goToMenu();
        if (UI._victoryClicked === 'next') { UI._victoryClicked = null; goToNextLevel(); }
        if (UI._victoryClicked === 'back') { UI._victoryClicked = null; goToMenu(); }
    }

    function drawVictory(timestamp) {
        drawPlaying(timestamp);
        var level = LevelManager.currentLevel;
        UI.drawVictory(ctx, canvas.width, canvas.height, moveCount,
            level && level.meta ? level.meta.par_moves : null);
    }

    // --- Nätverksmeddelanden ---

    function processNetworkMessages() {
        var msgs = Network.getMessages();
        for (var i = 0; i < msgs.length; i++) {
            handleNetMessage(msgs[i]);
        }
    }

    function handleNetMessage(msg) {
        switch (msg.type) {
            case 'start_level':
                if (gameMode === 'guest') {
                    startLevel(msg.levelPack || 0, msg.levelIndex || 0);
                }
                break;

            case 'input':
                // Gästens input mottagen av host
                if (gameMode === 'host') {
                    p2Input = msg.dir;
                    if (p1Input && p2Input) {
                        resolveTurn(LevelManager.currentLevel);
                    }
                }
                break;

            case 'state_sync':
                if (gameMode === 'guest') {
                    // Applicera state från host
                    var level = LevelManager.currentLevel;
                    if (!level) break;

                    for (var pi = 0; pi < msg.players.length; pi++) {
                        if (players[pi]) {
                            var pd = msg.players[pi];
                            players[pi].prevRow = pd.prevRow;
                            players[pi].prevCol = pd.prevCol;
                            players[pi].row = pd.row;
                            players[pi].col = pd.col;
                            players[pi].facing = pd.facing;
                            players[pi].animProgress = 0;
                        }
                    }
                    moveCount = msg.moveCount;

                    // Applicera grid-state (knappar/dörrar)
                    if (msg.grid) {
                        for (var key in msg.grid) {
                            var parts = key.split(',');
                            var r = parseInt(parts[0]);
                            var c = parseInt(parts[1]);
                            if (level.grid[r] && level.grid[r][c]) {
                                level.grid[r][c].state = msg.grid[key];
                            }
                        }
                    }

                    turnPhase = 'animating';
                    p1Input = null;
                    p2Input = null;
                }
                break;

            case 'level_complete':
                if (gameMode === 'guest') {
                    moveCount = msg.moveCount || moveCount;
                    clearClickRegions();
                    GameState.transition('victory');
                }
                break;
        }
    }

    // Exponera för Network callbacks
    window._gameOnConnect = function() {
        if (GameState.current === 'lobby') {
            // Anslutning lyckad — uppdatera lobby-UI
        }
    };

})();
