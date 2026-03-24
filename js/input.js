// Puzzle Teamwork — Input (tangentbord + touch)

const keys = {};
const keysPressed = {};  // Sant bara på första framen tangenten trycks

// Ingen WASD-mapping — bokstäver används direkt
// (WASD kan användas som alias i game.js vid solo-läge)

function setupInput(canvas) {
    window.addEventListener('keydown', function(e) {
        var key = e.key;
        if (!keys[key]) {
            keysPressed[key] = true;
        }
        keys[key] = true;

        // Förhindra scroll med piltangenter/space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', function(e) {
        var key = e.key;
        keys[key] = false;
        keysPressed[key] = false;
    });

    // Touch-knappar
    setupTouch(canvas);

    // Musklick
    setupMouse(canvas);
}

// Kontrollera om en tangent precis trycktes (konsumeras vid anrop)
function consumePressed(key) {
    if (keysPressed[key]) {
        keysPressed[key] = false;
        return true;
    }
    return false;
}

// Rensa alla pressed-flaggor (anropas varje frame efter input-hantering)
function clearPressed() {
    for (var k in keysPressed) {
        keysPressed[k] = false;
    }
}

// Musklick-stöd
const clickRegions = [];  // { id, x, y, w, h, callback }

function registerClickRegion(id, x, y, w, h, callback) {
    // Uppdatera om redan finns, annars lägg till
    for (var i = 0; i < clickRegions.length; i++) {
        if (clickRegions[i].id === id) {
            clickRegions[i].x = x;
            clickRegions[i].y = y;
            clickRegions[i].w = w;
            clickRegions[i].h = h;
            clickRegions[i].callback = callback;
            return;
        }
    }
    clickRegions.push({ id: id, x: x, y: y, w: w, h: h, callback: callback });
}

function clearClickRegions() {
    clickRegions.length = 0;
}

function setupMouse(canvas) {
    canvas.style.cursor = 'pointer';

    canvas.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = CONFIG.CANVAS_WIDTH / rect.width;
        var scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
        var mx = (e.clientX - rect.left) * scaleX;
        var my = (e.clientY - rect.top) * scaleY;

        for (var i = 0; i < clickRegions.length; i++) {
            var r = clickRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                r.callback();
                return;
            }
        }
    });
}

// Touch-stöd
const touchButtons = [];
let touchActive = false;

function setupTouch(canvas) {
    // D-pad vänster sida
    const btnSize = 60;
    const pad = 15;
    const baseX = 30;
    const baseY = CONFIG.CANVAS_HEIGHT - 180;

    touchButtons.push(
        { id: 'up',    key: 'ArrowUp',    x: baseX + btnSize + pad, y: baseY,                       w: btnSize, h: btnSize, label: '▲' },
        { id: 'left',  key: 'ArrowLeft',  x: baseX,                  y: baseY + btnSize + pad,       w: btnSize, h: btnSize, label: '◀' },
        { id: 'right', key: 'ArrowRight', x: baseX + (btnSize + pad) * 2, y: baseY + btnSize + pad, w: btnSize, h: btnSize, label: '▶' },
        { id: 'down',  key: 'ArrowDown',  x: baseX + btnSize + pad, y: baseY + (btnSize + pad) * 2, w: btnSize, h: btnSize, label: '▼' }
    );

    // Bekräfta-knapp höger sida
    touchButtons.push(
        { id: 'confirm', key: 'Enter', x: CONFIG.CANVAS_WIDTH - 100, y: CONFIG.CANVAS_HEIGHT - 100, w: 70, h: 70, label: 'OK' }
    );

    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouch(e) {
    e.preventDefault();
    touchActive = true;
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
    const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;

    // Nollställ alla touch-knappar
    for (var i = 0; i < touchButtons.length; i++) {
        var btn = touchButtons[i];
        keys[btn.key] = false;
    }

    // Kolla vilka knappar som trycks
    for (var ti = 0; ti < e.touches.length; ti++) {
        var touch = e.touches[ti];
        var tx = (touch.clientX - rect.left) * scaleX;
        var ty = (touch.clientY - rect.top) * scaleY;

        for (var bi = 0; bi < touchButtons.length; bi++) {
            var btn = touchButtons[bi];
            if (tx >= btn.x && tx <= btn.x + btn.w && ty >= btn.y && ty <= btn.y + btn.h) {
                if (!keys[btn.key]) {
                    keysPressed[btn.key] = true;
                }
                keys[btn.key] = true;
            }
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (e.touches.length === 0) {
        for (var i = 0; i < touchButtons.length; i++) {
            keys[touchButtons[i].key] = false;
        }
    }
}

// Rita touch-knappar (anropas från ui.js)
function drawTouchButtons(ctx) {
    if (!touchActive) return;

    for (var i = 0; i < touchButtons.length; i++) {
        var btn = touchButtons[i];
        var pressed = keys[btn.key];

        ctx.globalAlpha = pressed ? 0.6 : 0.3;
        pixelRect(ctx, btn.x, btn.y, btn.w, btn.h, PALETTE.accent);

        ctx.globalAlpha = pressed ? 1.0 : 0.7;
        drawTextCentered(ctx, btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2,
            '20px monospace', PALETTE.text);
    }
    ctx.globalAlpha = 1.0;
}
