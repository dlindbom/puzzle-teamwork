// Puzzle Teamwork — Nätverksmodul (stub för Fas 3)
// PeerJS-integration läggs till i Fas 3

const Network = {
    peer: null,
    conn: null,
    isHost: false,
    roomCode: '',
    connected: false,

    createRoom: function() {
        // Fas 3: PeerJS room creation
        console.log('Network.createRoom() — stub');
    },

    joinRoom: function(code) {
        // Fas 3: PeerJS connect
        console.log('Network.joinRoom() — stub, code:', code);
    },

    send: function(msg) {
        // Fas 3: skicka meddelande
    },

    onMessage: function(callback) {
        // Fas 3: registrera meddelandehanterare
    },

    disconnect: function() {
        this.connected = false;
    },

    getStatus: function() {
        return 'idle';
    }
};
