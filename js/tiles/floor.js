// Tile: Golv (gångbart)

TileRegistry.register('.', {
    name: 'floor',
    solid: false,
    draw: function(ctx, x, y, size) {
        pixelRect(ctx, x, y, size, size, PALETTE.floor);
        // Subtila prickar för textur
        var seed = seededRandom(x * 31 + y * 17);
        for (var i = 0; i < 3; i++) {
            var dx = Math.floor(seed() * (size - 4)) + 2;
            var dy = Math.floor(seed() * (size - 4)) + 2;
            pixelRect(ctx, x + dx, y + dy, 2, 2, PALETTE.floorDot);
        }
    }
});
