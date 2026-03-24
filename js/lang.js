// Puzzle Teamwork — Språksystem (sv/en)

const TRANSLATIONS = {
    sv: {
        title: 'Puzzle Teamwork',
        start: 'Starta spel',
        createRoom: 'Skapa rum',
        joinRoom: 'Gå med i rum',
        practice: 'Övning (solo)',
        levelComplete: 'Bana klar!',
        moves: 'Drag',
        par: 'Par',
        nextLevel: 'Nästa bana',
        backToMenu: 'Tillbaka',
        yourTurn: 'Välj ditt drag',
        waiting: 'Väntar på medspelare...',
        roomCode: 'Rumskod',
        enterCode: 'Skriv rumskod',
        connecting: 'Ansluter...',
        connected: 'Ansluten!',
        disconnected: 'Anslutningen bröts',
        controls: 'Piltangenter = röra sig',
        level: 'Bana',
        player1: 'Spelare 1',
        player2: 'Spelare 2',
    },
    en: {
        title: 'Puzzle Teamwork',
        start: 'Start Game',
        createRoom: 'Create Room',
        joinRoom: 'Join Room',
        practice: 'Practice (solo)',
        levelComplete: 'Level Complete!',
        moves: 'Moves',
        par: 'Par',
        nextLevel: 'Next Level',
        backToMenu: 'Back',
        yourTurn: 'Choose your move',
        waiting: 'Waiting for teammate...',
        roomCode: 'Room Code',
        enterCode: 'Enter room code',
        connecting: 'Connecting...',
        connected: 'Connected!',
        disconnected: 'Connection lost',
        controls: 'Arrow keys = move',
        level: 'Level',
        player1: 'Player 1',
        player2: 'Player 2',
    }
};

let currentLang = localStorage.getItem('pt_lang') || 'sv';

function t(key) {
    return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || key;
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('pt_lang', lang);
}
