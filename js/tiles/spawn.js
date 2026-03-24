// Tile: Spawnpunkt (spelare 1 = '1', spelare 2 = '2')
// Fungerar som golv efter spawn

TileRegistry.register('1', {
    name: 'spawn_p1',
    solid: false,
    draw: function(ctx, x, y, size) {
        // Rita golv som bas
        TileRegistry.get('.').draw(ctx, x, y, size);
        // Liten markering för P1
        pixelRect(ctx, x + size / 2 - 4, y + size - 6, 8, 4, PALETTE.p1);
        ctx.globalAlpha = 0.3;
        pixelRect(ctx, x + size / 2 - 6, y + size - 8, 12, 6, PALETTE.p1);
        ctx.globalAlpha = 1.0;
    }
});

TileRegistry.register('2', {
    name: 'spawn_p2',
    solid: false,
    draw: function(ctx, x, y, size) {
        TileRegistry.get('.').draw(ctx, x, y, size);
        pixelRect(ctx, x + size / 2 - 4, y + size - 6, 8, 4, PALETTE.p2);
        ctx.globalAlpha = 0.3;
        pixelRect(ctx, x + size / 2 - 6, y + size - 8, 12, 6, PALETTE.p2);
        ctx.globalAlpha = 1.0;
    }
});
