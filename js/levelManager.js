// Puzzle Teamwork — Level Manager
// Hanterar banpaket, progression och banval

const LEVEL_PACKS = [
    'levels/pack01_tutorial.json'
];

const LevelManager = {
    packs: [],
    currentPackIndex: 0,
    currentLevelIndex: 0,
    currentLevel: null,
    loaded: false,

    /**
     * Ladda alla banpaket.
     * @param {function} callback - callback() när allt är laddat
     */
    loadAll: function(callback) {
        var self = this;
        var remaining = LEVEL_PACKS.length;

        if (remaining === 0) {
            self.loaded = true;
            callback();
            return;
        }

        for (var i = 0; i < LEVEL_PACKS.length; i++) {
            (function(index) {
                LevelLoader.loadPack(LEVEL_PACKS[index], function(err, data) {
                    if (err) {
                        console.error('Kunde inte ladda banpaket:', LEVEL_PACKS[index], err);
                    } else {
                        self.packs[index] = data;
                    }
                    remaining--;
                    if (remaining === 0) {
                        self.loaded = true;
                        callback();
                    }
                });
            })(i);
        }
    },

    /**
     * Hämta aktuellt banpaket.
     */
    getCurrentPack: function() {
        return this.packs[this.currentPackIndex] || null;
    },

    /**
     * Ladda en specifik bana och returnera parsad data.
     */
    loadLevel: function(packIndex, levelIndex) {
        var pack = this.packs[packIndex];
        if (!pack || !pack.levels[levelIndex]) return null;

        this.currentPackIndex = packIndex;
        this.currentLevelIndex = levelIndex;
        this.currentLevel = LevelLoader.parse(pack.levels[levelIndex]);
        return this.currentLevel;
    },

    /**
     * Ladda nästa bana. Returnerar null om det inte finns fler.
     */
    nextLevel: function() {
        var pack = this.getCurrentPack();
        if (!pack) return null;

        var nextIndex = this.currentLevelIndex + 1;
        if (nextIndex < pack.levels.length) {
            return this.loadLevel(this.currentPackIndex, nextIndex);
        }
        // TODO: gå till nästa banpaket
        return null;
    },

    /**
     * Totalt antal banor i aktuellt paket.
     */
    getLevelCount: function() {
        var pack = this.getCurrentPack();
        return pack ? pack.levels.length : 0;
    }
};
