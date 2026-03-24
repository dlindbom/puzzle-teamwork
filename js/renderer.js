// Puzzle Teamwork — Renderer

const Renderer = {
    /**
     * Rita bakgrund (mörk med subtilt mönster).
     */
    drawBackground: function(ctx, w, h) {
        pixelRect(ctx, 0, 0, w, h, PALETTE.bg);

        // Subtilt rutnätsmönster
        ctx.globalAlpha = 0.03;
        for (var x = 0; x < w; x += 32) {
            pixelRect(ctx, x, 0, 1, h, PALETTE.text);
        }
        for (var y = 0; y < h; y += 32) {
            pixelRect(ctx, 0, y, w, 1, PALETTE.text);
        }
        ctx.globalAlpha = 1.0;
    },

    /**
     * Rita hela spelgriden.
     * @param {object} level - Parsad bana
     * @param {number} time - Aktuell tid (för animationer)
     */
    drawGrid: function(ctx, level, time) {
        var size = CONFIG.TILE_SIZE;
        var ox = Camera.offsetX;
        var oy = Camera.offsetY;

        for (var r = 0; r < level.rows; r++) {
            for (var c = 0; c < level.cols; c++) {
                var cell = level.grid[r][c];
                if (cell.tile.draw) {
                    var state = Object.assign({ time: time }, cell.state);
                    cell.tile.draw(ctx, ox + c * size, oy + r * size, size, state);
                }
            }
        }

        // Grid-linjer (subtila)
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = PALETTE.text;
        ctx.lineWidth = 1;
        for (var r = 0; r <= level.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(ox, oy + r * size);
            ctx.lineTo(ox + level.cols * size, oy + r * size);
            ctx.stroke();
        }
        for (var c = 0; c <= level.cols; c++) {
            ctx.beginPath();
            ctx.moveTo(ox + c * size, oy);
            ctx.lineTo(ox + c * size, oy + level.rows * size);
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    },

    /**
     * Rita alla spelare.
     */
    drawPlayers: function(ctx, players) {
        for (var i = 0; i < players.length; i++) {
            players[i].draw(ctx, Camera.offsetX, Camera.offsetY);
        }
    }
};
