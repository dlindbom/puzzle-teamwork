// Puzzle Teamwork — Hjälpfunktioner

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Rita en fylld rektangel med pixel-art-känsla (inga anti-alias-kanter)
function pixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Rita text centrerad
function drawTextCentered(ctx, text, x, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, Math.round(x), Math.round(y));
}

// Rita text vänsterjusterad
function drawText(ctx, text, x, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, Math.round(x), Math.round(y));
}

// Enkel seeded random (för deterministiska mönster)
function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
    };
}
