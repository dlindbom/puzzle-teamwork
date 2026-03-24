// Tile: Vägg (blockerar rörelse)

TileRegistry.register('W', {
    name: 'wall',
    solid: true,
    draw: function(ctx, x, y, size) {
        pixelRect(ctx, x, y, size, size, PALETTE.wall);

        // Tegelmönster
        var brickH = Math.floor(size / 3);
        var brickW = Math.floor(size / 2);

        for (var row = 0; row < 3; row++) {
            var offset = (row % 2 === 0) ? 0 : brickW / 2;
            var by = y + row * brickH;

            // Horisontell fog
            pixelRect(ctx, x, by, size, 1, PALETTE.wallDark);

            // Vertikala fogar
            for (var col = 0; col < 3; col++) {
                var bx = x + offset + col * brickW;
                if (bx > x && bx < x + size) {
                    pixelRect(ctx, bx, by, 1, brickH, PALETTE.wallDark);
                }
            }
        }

        // Ljusare topp-kant
        pixelRect(ctx, x, y, size, 2, PALETTE.wallLight);
    }
});
