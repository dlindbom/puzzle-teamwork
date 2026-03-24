// Tile: Dörr (blockerar tills aktiverad)
// Fullständig länk-implementation i Fas 2

TileRegistry.register('D', {
    name: 'door',
    solid: true,
    canEnter: function(gameCtx) {
        // I fas 1: alltid stängd. Fas 2: kollar state
        if (gameCtx && gameCtx.tileState) {
            var key = gameCtx.row + ',' + gameCtx.col;
            return gameCtx.tileState[key] && gameCtx.tileState[key].open;
        }
        return false;
    },
    draw: function(ctx, x, y, size, state) {
        var open = state && state.open;

        if (open) {
            // Öppen dörr: golv med dörrram
            TileRegistry.get('.').draw(ctx, x, y, size);
            ctx.globalAlpha = 0.4;
            pixelRect(ctx, x, y, 4, size, PALETTE.door);
            pixelRect(ctx, x + size - 4, y, 4, size, PALETTE.door);
            ctx.globalAlpha = 1.0;
        } else {
            // Stängd dörr
            pixelRect(ctx, x, y, size, size, PALETTE.door);
            // Plankor
            var plankW = Math.floor(size / 3);
            for (var i = 1; i < 3; i++) {
                pixelRect(ctx, x + i * plankW, y, 1, size, PALETTE.wallDark);
            }
            // Tvärslå
            pixelRect(ctx, x + 4, y + size / 2 - 2, size - 8, 4, PALETTE.wallDark);
        }
    }
});
