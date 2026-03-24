// Puzzle Teamwork — UI (menyer, HUD, overlays)

const UI = {
    menuSelection: 0,
    menuOptions: ['start'],

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

        for (var i = 0; i < options.length; i++) {
            var selected = (this.menuSelection === i);
            var y = startY + i * spacing;
            var color = selected ? PALETTE.accent : PALETTE.textMuted;
            var prefix = selected ? '▶ ' : '  ';

            drawTextCentered(ctx, prefix + options[i].label, w / 2, y,
                '24px monospace', color);

            if (selected) {
                // Markerings-bakgrund
                ctx.globalAlpha = 0.1;
                pixelRect(ctx, w / 2 - 150, y - 18, 300, 36, PALETTE.accent);
                ctx.globalAlpha = 1.0;
            }
        }

        // Kontroller-hint
        drawTextCentered(ctx, t('controls'), w / 2, h - 50,
            '14px monospace', PALETTE.textMuted);
        drawTextCentered(ctx, 'Enter = ' + t('start').toLowerCase(), w / 2, h - 30,
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

    /**
     * Rita vinst-skärm.
     */
    drawVictory: function(ctx, w, h, moveCount, parMoves) {
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

        // Knappar
        var pulse = 0.7 + 0.3 * Math.sin(GameState.stateTimer * 0.004);
        ctx.globalAlpha = pulse;
        drawTextCentered(ctx, 'Enter = ' + t('nextLevel'), w / 2, h * 0.7,
            '18px monospace', PALETTE.accent);
        drawTextCentered(ctx, 'Esc = ' + t('backToMenu'), w / 2, h * 0.77,
            '14px monospace', PALETTE.textMuted);
        ctx.globalAlpha = 1.0;
    },

    /**
     * Rita touch-knappar om touch är aktivt.
     */
    drawTouch: function(ctx) {
        drawTouchButtons(ctx);
    }
};
