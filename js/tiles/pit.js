// Tile: Grop (opasserbar visuell fara)

TileRegistry.register('P', {
    name: 'pit',
    solid: true,
    draw: function(ctx, x, y, size) {
        pixelRect(ctx, x, y, size, size, PALETTE.pit);
        // Mörk gradient-effekt (kant ljusare)
        ctx.globalAlpha = 0.3;
        pixelRect(ctx, x, y, size, 2, PALETTE.wallDark);
        pixelRect(ctx, x, y + size - 2, size, 2, PALETTE.wallDark);
        pixelRect(ctx, x, y, 2, size, PALETTE.wallDark);
        pixelRect(ctx, x + size - 2, y, 2, size, PALETTE.wallDark);
        ctx.globalAlpha = 1.0;
    }
});
