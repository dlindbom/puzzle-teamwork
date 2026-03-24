// Puzzle Teamwork — Nätverksmodul (PeerJS)

var Network = {
    peer: null,
    conn: null,
    isHost: false,
    roomCode: '',
    connected: false,
    _messageQueue: [],
    _statusText: '',
    _error: '',
    _debug: [],

    _log: function(msg) {
        console.log('[Network] ' + msg);
        this._debug.push(msg);
        if (this._debug.length > 10) this._debug.shift();
    },

    /**
     * PeerJS-konfiguration med STUN-servrar.
     */
    _peerConfig: {
        debug: 1,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        }
    },

    /**
     * Skapa ett rum (host).
     */
    createRoom: function(callback) {
        var self = this;

        if (typeof Peer === 'undefined') {
            self._error = 'PeerJS kunde inte laddas. Ladda om sidan.';
            if (callback) callback();
            return;
        }

        self._cleanup();
        self.isHost = true;
        self.roomCode = self._generateCode();
        self._statusText = t('connecting');
        self._error = '';
        self._log('Skapar rum: ' + self.roomCode);

        try {
            self.peer = new Peer('puzzleteam-' + self.roomCode, self._peerConfig);
        } catch (e) {
            self._error = 'Kunde inte skapa rum: ' + e.message;
            self._log('Fel: ' + e.message);
            if (callback) callback();
            return;
        }

        self.peer.on('open', function(id) {
            self._log('Peer öppen med ID: ' + id);
            self._statusText = t('roomCode') + ': ' + self.roomCode;
            if (callback) callback();
        });

        self.peer.on('connection', function(conn) {
            self._log('Inkommande anslutning från gäst');
            self.conn = conn;
            self._setupDataConnection(conn);
        });

        self.peer.on('error', function(err) {
            self._log('Host peer error: ' + err.type + ' - ' + err.message);
            if (err.type === 'unavailable-id') {
                self.roomCode = self._generateCode();
                self._log('Rumskod tagen, ny: ' + self.roomCode);
                if (self.peer) { try { self.peer.destroy(); } catch(e) {} }
                self.peer = null;
                self.createRoom(callback);
            } else {
                self._error = 'Fel: ' + (err.type || err.message);
                self._statusText = self._error;
            }
        });

        self.peer.on('disconnected', function() {
            self._log('Peer disconnected, försöker reconnect...');
            if (self.peer && !self.peer.destroyed) {
                try { self.peer.reconnect(); } catch(e) {}
            }
        });
    },

    /**
     * Gå med i ett rum (gäst).
     */
    joinRoom: function(code, callback) {
        var self = this;
        var callbackFired = false;

        function fireCallback(success) {
            if (!callbackFired && callback) {
                callbackFired = true;
                callback(success);
            }
        }

        if (typeof Peer === 'undefined') {
            self._error = 'PeerJS kunde inte laddas. Ladda om sidan.';
            fireCallback(false);
            return;
        }

        self._cleanup();
        self.isHost = false;
        self.roomCode = code;
        self._statusText = t('connecting');
        self._error = '';
        self._log('Ansluter till rum: ' + code);

        try {
            self.peer = new Peer(null, self._peerConfig);
        } catch (e) {
            self._error = 'Kunde inte starta: ' + e.message;
            self._log('Peer create error: ' + e.message);
            fireCallback(false);
            return;
        }

        // Timeout: 15 sekunder
        var connectTimeout = setTimeout(function() {
            self._log('Timeout efter 15s');
            self._error = 'Timeout — kunde inte nå rum ' + code + '. Är koden rätt?';
            self._statusText = self._error;
            fireCallback(false);
        }, 15000);

        self.peer.on('open', function(id) {
            self._log('Gäst-peer öppen: ' + id + ', ansluter till puzzleteam-' + code);
            var conn;
            try {
                conn = self.peer.connect('puzzleteam-' + code, { reliable: true });
            } catch (e) {
                clearTimeout(connectTimeout);
                self._error = 'Kunde inte ansluta till rum ' + code;
                self._log('Connect error: ' + e.message);
                fireCallback(false);
                return;
            }

            self.conn = conn;

            conn.on('open', function() {
                clearTimeout(connectTimeout);
                self._log('Anslutning öppen!');
                self.connected = true;
                self._statusText = t('connected');
                self._error = '';
                conn.send({ type: 'hello', playerName: 'P2' });
                fireCallback(true);
                if (window._gameOnConnect) window._gameOnConnect();
            });

            conn.on('data', function(data) {
                self._messageQueue.push(data);
            });

            conn.on('close', function() {
                self._log('Anslutning stängd');
                self.connected = false;
                self._statusText = t('disconnected');
            });

            conn.on('error', function(err) {
                clearTimeout(connectTimeout);
                self._log('Connection error: ' + err.type + ' - ' + err.message);
                self.connected = false;
                self._error = 'Anslutningsfel: ' + (err.type || err.message);
                self._statusText = self._error;
                fireCallback(false);
            });
        });

        self.peer.on('error', function(err) {
            clearTimeout(connectTimeout);
            self._log('Guest peer error: ' + err.type + ' - ' + err.message);
            var msg = 'Kunde inte ansluta';
            if (err.type === 'peer-unavailable') {
                msg = 'Rum "' + code + '" finns inte. Kolla att koden stämmer!';
            } else if (err.type === 'network') {
                msg = 'Nätverksfel — kolla din internetanslutning.';
            } else {
                msg = 'Fel: ' + (err.type || err.message);
            }
            self._error = msg;
            self._statusText = msg;
            fireCallback(false);
        });
    },

    _setupDataConnection: function(conn) {
        var self = this;

        conn.on('open', function() {
            self._log('Host: data-anslutning öppen');
            self.connected = true;
            self._statusText = t('connected');
            self._error = '';
            if (window._gameOnConnect) window._gameOnConnect();
        });

        conn.on('data', function(data) {
            self._messageQueue.push(data);
        });

        conn.on('close', function() {
            self._log('Host: anslutning stängd');
            self.connected = false;
            self._statusText = t('disconnected');
        });

        conn.on('error', function(err) {
            self._log('Host connection error: ' + err);
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

    disconnect: function() {
        this._log('Disconnect anropad');
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
