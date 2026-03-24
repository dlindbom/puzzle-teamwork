// Puzzle Teamwork — UI (menyer, HUD, overlays)

const UI = {
    menuSelection: 0,
    menuOptions: ['start'],
    _menuClicked: null,  // Sätts av musklick

    /**
     * Rita huvudmeny.
     */
    drawMenu: function(ctx, w, h) {
        // Bakgrund
        Renderer.drawBackground(ctx, w, h);

        // Titel
        drawTextCentered(ctx, t('title'), w / 2, h * 0.25,
            'bold 48px monospace', PALETTE.accent);

        // Undertitel
        drawTextCentered(ctx, 'LINDBOM ARCADE', w / 2, h * 0.25 + 50,
            '14px monospace', PALETTE.textMuted);

        // Menyalternativ
        var options = [
            { key: 'start', label: t('start') }
        ];

        var startY = h * 0.5;
        var spacing = 50;
        var self = this;

        for (var i = 0; i < options.length; i++) {
            var selected = (this.menuSelection === i);
            var y = startY + i * spacing;
            var color = selected ? PALETTE.accent : PALETTE.textMuted;
            var prefix = selected ? '▶ ' : '  ';

            // Klickbar region för detta menyalternativ
            var btnX = w / 2 - 150;
            var btnY = y - 18;
            var btnW = 300;
            var btnH = 36;

            drawTextCentered(ctx, prefix + options[i].label, w / 2, y,
                '24px monospace', color);

            // Markerings-bakgrund (alltid synlig som hover-yta)
            ctx.globalAlpha = selected ? 0.15 : 0.05;
            pixelRect(ctx, btnX, btnY, btnW, btnH, PALETTE.accent);
            ctx.globalAlpha = 1.0;

            // Registrera klickregion
            (function(optionKey) {
                registerClickRegion('menu_' + optionKey, btnX, btnY, btnW, btnH, function() {
                    self._menuClicked = optionKey;
                });
            })(options[i].key);
        }

        // Kontroller-hint
        drawTextCentered(ctx, 'Klicka eller tryck Enter', w / 2, h - 30,
            '14px monospace', PALETTE.textMuted);
    },

    /**
     * Hantera meny-input. Returnerar valt alternativ eller null.
     */
    updateMenu: function() {
        if (consumePressed('ArrowUp')) {
            this.menuSelection = Math.max(0, this.menuSelection - 1);
        }
        if (consumePressed('ArrowDown')) {
            this.menuSelection = Math.min(this.menuOptions.length - 1, this.menuSelection + 1);
        }
        if (consumePressed('Enter') || consumePressed(' ')) {
            return this.menuOptions[this.menuSelection];
        }
        // Musklick
        if (this._menuClicked) {
            var choice = this._menuClicked;
            this._menuClicked = null;
            return choice;
        }
        return null;
    },

    /**
     * Rita HUD under spel.
     */
    drawHUD: function(ctx, w, h, level, moveCount) {
        // Bannamn uppe till vänster
        var name = level.name || (t('level') + ' ' + (LevelManager.currentLevelIndex + 1));
        drawText(ctx, name, 10, 20, '16px monospace', PALETTE.text);

        // Dragräknare uppe till höger
        var movesText = t('moves') + ': ' + moveCount;
        ctx.font = '16px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = PALETTE.textMuted;
        ctx.textBaseline = 'middle';
        ctx.fillText(movesText, w - 10, 20);

        // Par (om det finns)
        if (level.meta && level.meta.par_moves) {
            ctx.fillText(t('par') + ': ' + level.meta.par_moves, w - 10, 40);
        }

        // Hint (första sekunderna)
        if (level.meta && level.meta.hint && GameState.stateTimer < 5000) {
            var alpha = GameState.stateTimer < 4000 ? 1 : 1 - (GameState.stateTimer - 4000) / 1000;
            ctx.globalAlpha = alpha;
            drawTextCentered(ctx, level.meta.hint, w / 2, h - 30,
                '14px monospace', PALETTE.textMuted);
            ctx.globalAlpha = 1.0;
        }
    },

    _victoryClicked: null,

    /**
     * Rita vinst-skärm.
     */
    drawVictory: function(ctx, w, h, moveCount, parMoves) {
        var self = this;

        // Overlay
        pixelRect(ctx, 0, 0, w, h, PALETTE.overlay);

        // Text
        drawTextCentered(ctx, t('levelComplete'), w / 2, h * 0.3,
            'bold 40px monospace', PALETTE.accent);

        drawTextCentered(ctx, t('moves') + ': ' + moveCount, w / 2, h * 0.45,
            '24px monospace', PALETTE.text);

        if (parMoves) {
            var color = moveCount <= parMoves ? PALETTE.exit : PALETTE.textWarn;
            drawTextCentered(ctx, t('par') + ': ' + parMoves, w / 2, h * 0.52,
                '18px monospace', color);
        }

        // Nästa bana-knapp (klickbar)
        var nextBtnX = w / 2 - 120;
        var nextBtnY = h * 0.66;
        var nextBtnW = 240;
        var nextBtnH = 40;

        ctx.globalAlpha = 0.15;
        pixelRect(ctx, nextBtnX, nextBtnY, nextBtnW, nextBtnH, PALETTE.accent);
        ctx.globalAlpha = 1.0;
        drawTextCentered(ctx, '▶ ' + t('nextLevel'), w / 2, nextBtnY + nextBtnH / 2,
            '18px monospace', PALETTE.accent);

        registerClickRegion('victory_next', nextBtnX, nextBtnY, nextBtnW, nextBtnH, function() {
            self._victoryClicked = 'next';
        });

        // Tillbaka-knapp (klickbar)
        var backBtnX = w / 2 - 80;
        var backBtnY = h * 0.75;
        var backBtnW = 160;
        var backBtnH = 30;

        ctx.globalAlpha = 0.08;
        pixelRect(ctx, backBtnX, backBtnY, backBtnW, backBtnH, PALETTE.textMuted);
        ctx.globalAlpha = 1.0;
        drawTextCentered(ctx, t('backToMenu'), w / 2, backBtnY + backBtnH / 2,
            '14px monospace', PALETTE.textMuted);

        registerClickRegion('victory_back', backBtnX, backBtnY, backBtnW, backBtnH, function() {
            self._victoryClicked = 'back';
        });
    },

    /**
     * Rita touch-knappar om touch är aktivt.
     */
    drawTouch: function(ctx) {
        drawTouchButtons(ctx);
    }
};
