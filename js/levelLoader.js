// Puzzle Teamwork — Level Loader
// Parsar JSON-bandata till spelbar grid

const LevelLoader = {
    /**
     * Ladda ett banpaket från JSON-fil.
     * @param {string} url - Sökväg till JSON-fil
     * @param {function} callback - callback(err, packData)
     */
    loadPack: function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        callback(null, data);
                    } catch (e) {
                        callback('JSON parse error: ' + e.message, null);
                    }
                } else {
                    callback('HTTP ' + xhr.status, null);
                }
            }
        };
        xhr.send();
    },

    /**
     * Parsa en enskild bana till spelbar grid.
     * @param {object} levelData - En bana från banpaketet
     * @returns {object} { cols, rows, grid[][], spawns, exits, links, meta }
     */
    parse: function(levelData) {
        var cols = levelData.cols;
        var rows = levelData.rows;
        var grid = [];
        var spawns = {};
        var exits = [];

        for (var r = 0; r < levelData.grid.length; r++) {
            var row = [];
            var line = levelData.grid[r];
            for (var c = 0; c < line.length; c++) {
                var ch = line[c];
                var cell = {
                    char: ch,
                    tile: TileRegistry.get(ch),
                    row: r,
                    col: c,
                    state: {}
                };

                // Markera spawnpunkter
                if (ch === '1') {
                    spawns.p1 = { row: r, col: c };
                } else if (ch === '2') {
                    spawns.p2 = { row: r, col: c };
                }

                // Markera utgångar
                if (ch === 'E') {
                    exits.push({ row: r, col: c });
                }

                // Initialt state för dörrar
                if (ch === 'D') {
                    cell.state.open = false;
                }

                // Initialt state för knappar
                if (ch === 'B') {
                    cell.state.pressed = false;
                }

                row.push(cell);
            }
            grid.push(row);
        }

        // Parsa länkar (B@rad,kol → [D@rad,kol, ...])
        var links = {};
        if (levelData.links) {
            for (var key in levelData.links) {
                var parts = key.split('@');
                if (parts.length === 2) {
                    var sourceKey = parts[1]; // "rad,kol"
                    links[sourceKey] = [];
                    var targets = levelData.links[key];
                    for (var i = 0; i < targets.length; i++) {
                        var tParts = targets[i].split('@');
                        if (tParts.length === 2) {
                            links[sourceKey].push(tParts[1]);
                        }
                    }
                }
            }
        }

        return {
            id: levelData.id,
            name: levelData.name || '',
            description: levelData.description || '',
            cols: cols,
            rows: rows,
            grid: grid,
            spawns: spawns,
            exits: exits,
            links: links,
            meta: levelData.meta || {}
        };
    }
};
