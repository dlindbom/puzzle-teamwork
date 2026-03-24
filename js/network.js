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
    _error: '',

    /**
     * Skapa ett rum (host).
     */
    createRoom: function(callback) {
        var self = this;

        if (typeof Peer === 'undefined') {
            self._error = 'PeerJS kunde inte laddas. Ladda om sidan med Ctrl+Shift+R';
            if (callback) callback();
            return;
        }

        // Rensa eventuell gammal anslutning
        self._cleanup();

        self.isHost = true;
        self.roomCode = self._generateCode();
        self._statusText = t('connecting');
        self._error = '';

        try {
            self.peer = new Peer('puzzleteam-' + self.roomCode, { debug: 0 });
        } catch (e) {
            self._error = 'Kunde inte skapa rum: ' + e.message;
            if (callback) callback();
            return;
        }

        self.peer.on('open', function() {
            self._statusText = t('roomCode') + ': ' + self.roomCode;
            if (callback) callback();
        });

        self.peer.on('connection', function(conn) {
            self.conn = conn;
            self._setupConnection(conn);
        });

        self.peer.on('error', function(err) {
            console.error('PeerJS host error:', err);
            if (err.type === 'unavailable-id') {
                // Rumskoden var tagen — försök igen med ny kod
                self.roomCode = self._generateCode();
                if (self.peer) self.peer.destroy();
                self.peer = null;
                self.createRoom(callback);
            } else {
                self._error = 'Anslutningsfel: ' + (err.type || err.message || 'okänt');
                self._statusText = self._error;
            }
        });

        self.peer.on('disconnected', function() {
            // Försök återansluta
            if (self.peer && !self.peer.destroyed) {
                self.peer.reconnect();
            }
        });
    },

    /**
     * Gå med i ett rum (gäst).
     */
    joinRoom: function(code, callback) {
        var self = this;

        if (typeof Peer === 'undefined') {
            self._error = 'PeerJS kunde inte laddas. Ladda om sidan med Ctrl+Shift+R';
            if (callback) callback(false);
            return;
        }

        // Rensa eventuell gammal anslutning
        self._cleanup();

        self.isHost = false;
        self.roomCode = code;
        self._statusText = t('connecting');
        self._error = '';

        try {
            self.peer = new Peer(null, { debug: 0 });
        } catch (e) {
            self._error = 'Kunde inte ansluta: ' + e.message;
            if (callback) callback(false);
            return;
        }

        self.peer.on('open', function() {
            var conn;
            try {
                conn = self.peer.connect('puzzleteam-' + code, { reliable: true });
            } catch (e) {
                self._error = 'Kunde inte ansluta till rum ' + code;
                if (callback) callback(false);
                return;
            }

            self.conn = conn;

            // Timeout: om anslutningen inte öppnas inom 8 sekunder
            var connectTimeout = setTimeout(function() {
                if (!self.connected) {
                    self._error = 'Timeout — kunde inte nå rum ' + code + '. Kontrollera koden.';
                    self._statusText = self._error;
                    if (callback) {
                        callback(false);
                        callback = null; // Förhindra dubbelanrop
                    }
                }
            }, 8000);

            conn.on('open', function() {
                clearTimeout(connectTimeout);
                self.connected = true;
                self._statusText = t('connected');
                self._error = '';

                // Skicka hello
                conn.send({ type: 'hello', playerName: 'P2' });

                if (callback) {
                    callback(true);
                    callback = null;
                }
                if (window._gameOnConnect) window._gameOnConnect();
            });

            conn.on('data', function(data) {
                self._messageQueue.push(data);
            });

            conn.on('close', function() {
                clearTimeout(connectTimeout);
                self.connected = false;
                self._statusText = t('disconnected');
            });

            conn.on('error', function(err) {
                clearTimeout(connectTimeout);
                console.error('Connection error:', err);
                self.connected = false;
                self._error = 'Anslutningsfel: ' + (err.type || err.message || 'okänt');
                self._statusText = self._error;
                if (callback) {
                    callback(false);
                    callback = null;
                }
            });
        });

        self.peer.on('error', function(err) {
            console.error('PeerJS guest error:', err);
            var msg = 'Kunde inte ansluta';
            if (err.type === 'peer-unavailable') {
                msg = 'Rum "' + code + '" hittades inte. Kontrollera koden.';
            } else if (err.type === 'network') {
                msg = 'Nätverksfel — kontrollera din internetanslutning.';
            } else {
                msg = 'Fel: ' + (err.type || err.message);
            }
            self._error = msg;
            self._statusText = msg;
            if (callback) {
                callback(false);
                callback = null;
            }
        });
    },

    _setupConnection: function(conn) {
        var self = this;

        conn.on('open', function() {
            self.connected = true;
            self._statusText = t('connected');
            self._error = '';

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

    send: function(msg) {
        if (this.conn && this.conn.open) {
            this.conn.send(msg);
        }
    },

    getMessages: function() {
        var msgs = this._messageQueue;
        this._messageQueue = [];
        return msgs;
    },

    /**
     * Intern cleanup utan att nollställa allt.
     */
    _cleanup: function() {
        if (this.conn) {
            try { this.conn.close(); } catch(e) {}
            this.conn = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch(e) {}
            this.peer = null;
        }
        this.connected = false;
        this._messageQueue = [];
    },

    /**
     * Koppla ner helt.
     */
    disconnect: function() {
        this._cleanup();
        this.roomCode = '';
        this.isHost = false;
        this._statusText = '';
        this._error = '';
    },

    getStatus: function() {
        if (this.connected) return 'connected';
        if (this.peer && !this.peer.destroyed) return 'waiting';
        return 'idle';
    },

    _generateCode: function() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        var code = '';
        for (var i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
};
