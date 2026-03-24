// Puzzle Teamwork — Tillståndsmaskin

const GameState = {
    current: 'loading',
    previous: '',
    data: {},
    stateTimer: 0,

    transition: function(newState, data) {
        this.previous = this.current;
        this.current = newState;
        this.data = data || {};
        this.stateTimer = 0;
    },

    is: function(state) {
        return this.current === state;
    },

    update: function(dt) {
        this.stateTimer += dt;
    }
};

// Möjliga tillstånd:
// 'loading'      — Laddar banpaket
// 'menu'         — Huvudmeny
// 'lobby'        — Väntar på medspelare (Fas 3)
// 'playing'      — Aktivt spelande
// 'victory'      — Bana klar
// 'disconnected' — Tappad anslutning (Fas 3)
