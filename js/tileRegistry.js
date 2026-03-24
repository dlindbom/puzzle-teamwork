// Puzzle Teamwork — Tile Registry
// Modulärt system: varje tile-typ registrerar sig själv

const TileRegistry = {
    _tiles: {},

    /**
     * Registrera en tile-typ.
     * @param {string} char - Tecknet som representerar tilen i ban-JSON (t.ex. 'W')
     * @param {object} def - Definition med:
     *   name    {string}   — Visningsnamn
     *   solid   {boolean}  — Blockerar rörelse? (default: true)
     *   draw    {function} — draw(ctx, x, y, tileSize, state)
     *   onStep  {function} — onStep(gameCtx, playerIndex) — anropas när spelare kliver på
     *   onLeave {function} — onLeave(gameCtx, playerIndex) — anropas när spelare lämnar
     *   canEnter {function} — canEnter(gameCtx, playerIndex) → boolean
     */
    register: function(char, def) {
        this._tiles[char] = {
            char: char,
            name: def.name || char,
            solid: def.solid !== undefined ? def.solid : true,
            draw: def.draw || null,
            onStep: def.onStep || null,
            onLeave: def.onLeave || null,
            canEnter: def.canEnter || function() { return !def.solid; },
        };
    },

    get: function(char) {
        return this._tiles[char] || this._tiles['W'];
    },

    has: function(char) {
        return char in this._tiles;
    },

    getAll: function() {
        return Object.assign({}, this._tiles);
    }
};
