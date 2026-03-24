// Tile: Tryckknapp (aktiverar länkade mål)
// Fullständig implementation i Fas 2

TileRegistry.register('B', {
    name: 'button',
    solid: false,
    draw: function(ctx, x, y, size, state) {
        // Golv som bas
        TileRegistry.get('.').draw(ctx, x, y, size);

        var pressed = state && state.pressed;
        var color = pressed ? PALETTE.buttonOn : PALETTE.button;

        // Knappens bas (cirkulär känsla med rektanglar)
        var pad = 10;
        pixelRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, color);

        // Inre detalj
        var inner = 14;
        pixelRect(ctx, x + inner, y + inner, size - inner * 2, size - inner * 2,
            pressed ? PALETTE.button : PALETTE.wallDark);
    }
});
