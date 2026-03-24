// Puzzle Teamwork — UI (menyer, HUD, overlays)

var UI = {
    menuSelection: 0,
    menuOptions: ['online_host', 'online_join', 'solo'],
    _menuClicked: null,
    showJoinInput: false,
    joinCode: '',

    // --- Huvudmeny ---

    drawMenu: function(ctx, w, h) {
        Renderer.drawBackground(ctx, w, h);

        drawTextCentered(ctx, t('title'), w / 2, h * 0.2,
            'bold 48px monospace', PALETTE.accent);
        drawTextCentered(ctx, 'LINDBOM ARCADE', w / 2, h * 0.2 + 50,
            '14px monospace', PALETTE.textMuted);

        // Kodinmatning för "Gå med"
        if (this.showJoinInput) {
            this._drawJoinInput(ctx, w, h);
            return;
        }

        var options = [
            { key: 'online_host', label: t('createRoom'), desc: 'Skapa ett rum och bjud in' },
            { key: 'online_join', label: t('joinRoom'), desc: 'Skriv in en rumskod' },
            { key: 'solo', label: t('practice'), desc: 'Spela ensam' },
        ];

        var startY = h * 0.42;
        var spacing = 55;
        var self = this;

        for (var i = 0; i < options.length; i++) {
            var selected = (this.menuSelection === i);
            var y = startY + i * spacing;
            var color = selected ? PALETTE.accent : PALETTE.text;
            var prefix = selected ? '▶ ' : '  ';

            var btnX = w / 2 - 170;
            var btnY = y - 20;
            var btnW = 340;
            var btnH = 42;

            // Bakgrund
            ctx.globalAlpha = selected ? 0.15 : 0.05;
            pixelRect(ctx, btnX, btnY, btnW, btnH, selected ? PALETTE.accent : PALETTE.text);
            ctx.globalAlpha = 1.0;

            drawTextCentered(ctx, prefix + options[i].label, w / 2, y,
                '20px monospace', color);

            // Beskrivning
            drawTextCentered(ctx, options[i].desc, w / 2, y + 16,
                '11px monospace', PALETTE.textMuted);

            // Klickregion
            (function(optionKey, idx) {
                registerClickRegion('menu_' + optionKey, btnX, btnY, btnW, btnH, function() {
                    self.menuSelection = idx;
                    self._menuClicked = optionKey;
                });
            })(options[i].key, i);
        }

        drawTextCentered(ctx, 'Klicka eller tryck Enter', w / 2, h - 30,
            '14px monospace', PALETTE.textMuted);
    },

    _drawJoinInput: function(ctx, w, h) {
        var self = this;
        var y = h * 0.5;

        drawTextCentered(ctx, t('enterCode'), w / 2, y - 50,
            '20px monospace', PALETTE.text);

        // Kod-rutor
        var boxSize = 50;
        var gap = 12;
        var totalW = 4 * boxSize + 3 * gap;
        var startX = (w - totalW) / 2;

        for (var i = 0; i < 4; i++) {
            var bx = startX + i * (boxSize + gap);
            var ch = this.joinCode[i] || '';

            ctx.strokeStyle = i === this.joinCode.length ? PALETTE.accent : PALETTE.textMuted;
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, y - 25, boxSize, boxSize);

            if (ch) {
                drawTextCentered(ctx, ch, bx + boxSize / 2, y,
                    'bold 28px monospace', PALETTE.accent);
            }
        }

        // Bekräfta-knapp
        if (this.joinCode.length === 4) {
            var btnY = y + 50;
            ctx.globalAlpha = 0.15;
            pixelRect(ctx, w / 2 - 100, btnY, 200, 40, PALETTE.accent);
            ctx.globalAlpha = 1.0;
            drawTextCentered(ctx, '▶ Anslut', w / 2, btnY + 20,
                '20px monospace', PALETTE.accent);

            registerClickRegion('join_confirm', w / 2 - 100, btnY, 200, 40, function() {
                self._menuClicked = 'join_confirm';
            });
        }

        // Tillbaka
        drawTextCentered(ctx, 'Esc = Tillbaka', w / 2, h - 30,
            '14px monospace', PALETTE.textMuted);

        // Hantera tangentbordsinmatning för kod
        for (var ci = 65; ci <= 90; ci++) { // A-Z
            var letter = String.fromCharCode(ci);
            if (consumePressed(letter) || consumePressed(letter.toLowerCase())) {
                if (this.joinCode.length < 4) {
                    this.joinCode += letter;
                }
            }
        }
        if (consumePressed('Backspace')) {
            this.joinCode = this.joinCode.slice(0, -1);
        }
        if (consumePressed('Escape')) {
            this.showJoinInput = false;
            this.joinCode = '';
        }
    },

    updateMenu: function() {
        if (this.showJoinInput) {
            if (consumePressed('Enter') && this.joinCode.length === 4) {
                return 'join_confirm';
            }
            return null;
        }

        if (consumePressed('ArrowUp')) {
            this.menuSelection = Math.max(0, this.menuSelection - 1);
        }
        if (consumePressed('ArrowDown')) {
            this.menuSelection = Math.min(this.menuOptions.length - 1, this.menuSelection + 1);
        }
        if (consumePressed('Enter') || consumePressed(' ')) {
            return this.menuOptions[this.menuSelection];
        }
        if (this._menuClicked) {
            var choice = this._menuClicked;
            this._menuClicked = null;
            return choice;
        }
        return null;
    },

    // --- Lobby ---

    drawLobby: function(ctx, w, h) {
        Renderer.drawBackground(ctx, w, h);

        drawTextCentered(ctx, t('title'), w / 2, h * 0.15,
            'bold 36px monospace', PALETTE.accent);

        if (Network.isHost) {
            drawTextCentered(ctx, t('roomCode') + ':', w / 2, h * 0.35,
                '18px monospace', PALETTE.textMuted);

            // Stor rumskod
            drawTextCentered(ctx, Network.roomCode, w / 2, h * 0.45,
                'bold 64px monospace', PALETTE.accent);

            drawTextCentered(ctx, 'Dela koden med din medspelare', w / 2, h * 0.55,
                '14px monospace', PALETTE.textMuted);
        } else {
            drawTextCentered(ctx, t('connecting'), w / 2, h * 0.4,
                '20px monospace', PALETTE.textMuted);
        }

        // Anslutningsstatus
        var statusColor = Network.connected ? '#22c55e' : PALETTE.textWarn;
        var statusIcon = Network.connected ? '●' : '○';
        var statusLabel = Network.connected ? t('connected') + ' — Startar...' : t('waiting');
        drawTextCentered(ctx, statusIcon + ' ' + statusLabel, w / 2, h * 0.7,
            '16px monospace', statusColor);

        drawTextCentered(ctx, 'Esc = Avbryt', w / 2, h - 30,
            '14px monospace', PALETTE.textMuted);
    },

    // --- HUD ---

    drawHUD: function(ctx, w, h, level, moveCount) {
        var name = level.name || (t('level') + ' ' + (LevelManager.currentLevelIndex + 1));
        drawText(ctx, name, 10, 20, '16px monospace', PALETTE.text);

        var movesText = t('moves') + ': ' + moveCount;
        ctx.font = '16px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = PALETTE.textMuted;
        ctx.textBaseline = 'middle';
        ctx.fillText(movesText, w - 10, 20);

        if (level.meta && level.meta.par_moves) {
            ctx.fillText(t('par') + ': ' + level.meta.par_moves, w - 10, 40);
        }

        if (level.meta && level.meta.hint && GameState.stateTimer < 5000) {
            var alpha = GameState.stateTimer < 4000 ? 1 : 1 - (GameState.stateTimer - 4000) / 1000;
            ctx.globalAlpha = alpha;
            drawTextCentered(ctx, level.meta.hint, w / 2, h - 50,
                '14px monospace', PALETTE.textMuted);
            ctx.globalAlpha = 1.0;
        }
    },

    // --- Vinst ---

    _victoryClicked: null,

    drawVictory: function(ctx, w, h, moveCount, parMoves) {
        var self = this;

        pixelRect(ctx, 0, 0, w, h, PALETTE.overlay);

        drawTextCentered(ctx, t('levelComplete'), w / 2, h * 0.3,
            'bold 40px monospace', PALETTE.accent);

        drawTextCentered(ctx, t('moves') + ': ' + moveCount, w / 2, h * 0.45,
            '24px monospace', PALETTE.text);

        if (parMoves) {
            var color = moveCount <= parMoves ? PALETTE.exit : PALETTE.textWarn;
            drawTextCentered(ctx, t('par') + ': ' + parMoves, w / 2, h * 0.52,
                '18px monospace', color);
        }

        // Nästa bana
        var nextBtnX = w / 2 - 120;
        var nextBtnY = h * 0.66;
        ctx.globalAlpha = 0.15;
        pixelRect(ctx, nextBtnX, nextBtnY, 240, 40, PALETTE.accent);
        ctx.globalAlpha = 1.0;
        drawTextCentered(ctx, '▶ ' + t('nextLevel'), w / 2, nextBtnY + 20,
            '18px monospace', PALETTE.accent);
        registerClickRegion('victory_next', nextBtnX, nextBtnY, 240, 40, function() {
            self._victoryClicked = 'next';
        });

        // Tillbaka
        var backBtnX = w / 2 - 80;
        var backBtnY = h * 0.75;
        ctx.globalAlpha = 0.08;
        pixelRect(ctx, backBtnX, backBtnY, 160, 30, PALETTE.textMuted);
        ctx.globalAlpha = 1.0;
        drawTextCentered(ctx, t('backToMenu'), w / 2, backBtnY + 15,
            '14px monospace', PALETTE.textMuted);
        registerClickRegion('victory_back', backBtnX, backBtnY, 160, 30, function() {
            self._victoryClicked = 'back';
        });
    },

    drawTouch: function(ctx) {
        drawTouchButtons(ctx);
    }
};
