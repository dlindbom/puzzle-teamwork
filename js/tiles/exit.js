// Tile: Utgång (vinstvillkor)

TileRegistry.register('E', {
    name: 'exit',
    solid: false,
    draw: function(ctx, x, y, size, state) {
        // Golv som bas
        pixelRect(ctx, x, y, size, size, PALETTE.floor);

        // Pulserande glow
        var pulse = 0.5 + 0.5 * Math.sin((state && state.time || 0) * 0.003);

        ctx.globalAlpha = 0.2 + 0.15 * pulse;
        pixelRect(ctx, x + 2, y + 2, size - 4, size - 4, PALETTE.exit);
        ctx.globalAlpha = 1.0;

        // Diamant/stjärna i mitten
        var cx = x + size / 2;
        var cy = y + size / 2;
        var s = 6 + 2 * pulse;

        ctx.fillStyle = PALETTE.exit;
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx + s * 0.6, cy);
        ctx.lineTo(cx, cy + s);
        ctx.lineTo(cx - s * 0.6, cy);
        ctx.closePath();
        ctx.fill();

        // Ram
        ctx.strokeStyle = PALETTE.exit;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
    }
});
