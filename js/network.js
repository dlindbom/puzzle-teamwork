// Puzzle Teamwork — Nätverksmodul (PeerJS)

var Network = {
    peer: null,
    conn: null,
    isHost: false,
    roomCode: '',
    connected: false,
    _messageQueue: [],
    _onConnectCallback: null,
    _statusText: '',

    /**
     * Skapa ett rum (host).
     */
    createRoom: function(callback) {
        var self = this;
        self.isHost = true;
        self.roomCode = self._generateCode();
        self._statusText = t('connecting');

        self.peer = new Peer('puzzleteam-' + self.roomCode, {
            debug: 0
        });

        self.peer.on('open', function() {
            self._statusText = t('roomCode') + ': ' + self.roomCode;
            if (callback) callback();
        });

        self.peer.on('connection', function(conn) {
            self.conn = conn;
            self._setupConnection(conn);
        });

        self.peer.on('error', function(err) {
            console.error('PeerJS error:', err);
            self._statusText = 'Fel: ' + err.type;
            // Om rumskoden redan är tagen, generera ny
            if (err.type === 'unavailable-id') {
                self.roomCode = self._generateCode();
                self.peer.destroy();
                self.createRoom(callback);
            }
        });
    },

    /**
     * Gå med i ett rum (gäst).
     */
    joinRoom: function(code, callback) {
        var self = this;
        self.isHost = false;
        self.roomCode = code;
        self._statusText = t('connecting');

        self.peer = new Peer(null, { debug: 0 });

        self.peer.on('open', function() {
            var conn = self.peer.connect('puzzleteam-' + code, {
                reliable: true
            });
            self.conn = conn;
            self._setupConnection(conn);
            self._onConnectCallback = callback;
        });

        self.peer.on('error', function(err) {
            console.error('PeerJS error:', err);
            self._statusText = 'Kunde inte ansluta';
            if (callback) callback(false);
        });
    },

    _setupConnection: function(conn) {
        var self = this;

        conn.on('open', function() {
            self.connected = true;
            self._statusText = t('connected');

            if (!self.isHost) {
                // Gäst: skicka hello
                conn.send({ type: 'hello', playerName: 'P2' });
            }

            if (self._onConnectCallback) {
                self._onConnectCallback(true);
                self._onConnectCallback = null;
            }

            if (window._gameOnConnect) window._gameOnConnect();
        });

        conn.on('data', function(data) {
            self._messageQueue.push(data);
        });

        conn.on('close', function() {
            self.connected = false;
            self._statusText = t('disconnected');
        });

        conn.on('error', function(err) {
            console.error('Connection error:', err);
            self.connected = false;
        });
    },

    /**
     * Skicka meddelande till peer.
     */
    send: function(msg) {
        if (this.conn && this.conn.open) {
            this.conn.send(msg);
        }
    },

    /**
     * Hämta och tömma meddelandekön.
     */
    getMessages: function() {
        var msgs = this._messageQueue;
        this._messageQueue = [];
        return msgs;
    },

    /**
     * Koppla ner.
     */
    disconnect: function() {
        this.connected = false;
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.roomCode = '';
        this._statusText = '';
        this._messageQueue = [];
    },

    getStatus: function() {
        if (this.connected) return 'connected';
        if (this.peer) return 'waiting';
        return 'idle';
    },

    _generateCode: function() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Inga I, O (förväxling)
        var code = '';
        for (var i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
};
