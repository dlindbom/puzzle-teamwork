// Puzzle Teamwork — Spelarmodul

function Player(index, row, col) {
    this.index = index;        // 0 = P1, 1 = P2
    this.row = row;
    this.col = col;
    this.prevRow = row;
    this.prevCol = col;
    this.animProgress = 1;     // 0–1, 1 = klar med rörelse
    this.onExit = false;

    // Visuellt
    this.color = index === 0 ? PALETTE.p1 : PALETTE.p2;
    this.colorLight = index === 0 ? PALETTE.p1Light : PALETTE.p2Light;
    this.colorDark = index === 0 ? PALETTE.p1Dark : PALETTE.p2Dark;
    this.label = index === 0 ? 'P1' : 'P2';

    // Riktning spelaren tittar
    this.facing = 'down';
}

/**
 * Flytta spelaren till ny position (om giltig).
 * @param {string} dir - 'up', 'down', 'left', 'right'
 * @param {object} level - Parsad bana från LevelLoader
 * @param {Player[]} players - Alla spelare (för kollisionskoll)
 * @returns {boolean} true om flytten lyckades
 */
Player.prototype.tryMove = function(dir, level, players) {
    var newRow = this.row;
    var newCol = this.col;

    if (dir === 'up')    newRow--;
    if (dir === 'down')  newRow++;
    if (dir === 'left')  newCol--;
    if (dir === 'right') newCol++;

    this.facing = dir;

    // Utanför banan?
    if (newRow < 0 || newRow >= level.rows || newCol < 0 || newCol >= level.cols) {
        return false;
    }

    var cell = level.grid[newRow][newCol];

    // Kan vi kliva in?
    if (cell.tile.solid) {
        // Kolla canEnter om den finns
        var canEnter = cell.tile.canEnter({
            row: newRow,
            col: newCol,
            tileState: this._getTileStates(level)
        }, this.index);
        if (!canEnter) return false;
    }

    // Annan spelare i vägen?
    for (var i = 0; i < players.length; i++) {
        if (i !== this.index && players[i].row === newRow && players[i].col === newCol) {
            return false;
        }
    }

    // Flytta
    this.prevRow = this.row;
    this.prevCol = this.col;
    this.row = newRow;
    this.col = newCol;
    this.animProgress = 0;

    return true;
};

Player.prototype._getTileStates = function(level) {
    var states = {};
    for (var r = 0; r < level.grid.length; r++) {
        for (var c = 0; c < level.grid[r].length; c++) {
            var cell = level.grid[r][c];
            if (cell.state && Object.keys(cell.state).length > 0) {
                states[r + ',' + c] = cell.state;
            }
        }
    }
    return states;
};

/**
 * Uppdatera animation.
 * @param {number} dt - Delta-tid i ms
 */
Player.prototype.update = function(dt) {
    if (this.animProgress < 1) {
        this.animProgress += dt / CONFIG.MOVE_ANIM_MS;
        if (this.animProgress > 1) this.animProgress = 1;
    }
};

/**
 * Rita spelaren.
 */
Player.prototype.draw = function(ctx, offsetX, offsetY) {
    var size = CONFIG.TILE_SIZE;

    // Interpolera position under animation
    var t = this.animProgress;
    var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
    var drawCol = lerp(this.prevCol, this.col, eased);
    var drawRow = lerp(this.prevRow, this.row, eased);

    var x = offsetX + drawCol * size;
    var y = offsetY + drawRow * size;

    // Kropp
    var bodyW = size * 0.5;
    var bodyH = size * 0.55;
    var bodyX = x + (size - bodyW) / 2;
    var bodyY = y + size * 0.35;

    pixelRect(ctx, bodyX, bodyY, bodyW, bodyH, this.color);

    // Huvud
    var headSize = size * 0.4;
    var headX = x + (size - headSize) / 2;
    var headY = y + size * 0.08;

    pixelRect(ctx, headX, headY, headSize, headSize, this.colorLight);

    // Ögon (beroende på riktning)
    var eyeSize = 3;
    var eyeY = headY + headSize * 0.4;
    var eyeOffX = 0;
    var eyeOffY = 0;

    if (this.facing === 'left')  eyeOffX = -2;
    if (this.facing === 'right') eyeOffX = 2;
    if (this.facing === 'up')    eyeOffY = -2;
    if (this.facing === 'down')  eyeOffY = 2;

    // Vänster öga
    pixelRect(ctx, headX + headSize * 0.25 - eyeSize / 2 + eyeOffX,
        eyeY + eyeOffY, eyeSize, eyeSize, PALETTE.bg);
    // Höger öga
    pixelRect(ctx, headX + headSize * 0.75 - eyeSize / 2 + eyeOffX,
        eyeY + eyeOffY, eyeSize, eyeSize, PALETTE.bg);

    // Spelarettikett
    drawTextCentered(ctx, this.label, x + size / 2, y - 4,
        '10px monospace', this.color);
};

/**
 * Kolla om spelaren står på en exit-tile.
 */
Player.prototype.checkExit = function(level) {
    var cell = level.grid[this.row][this.col];
    this.onExit = (cell.char === 'E');
    return this.onExit;
};
