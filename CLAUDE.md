# Puzzle Teamwork

Kooperativt pusselspel för Lindbom Arcade. Två spelare löser rutnätsbaserade pusselbanor tillsammans — varje spelare på sin egen enhet.

## Tech

- Vanilla HTML5 + CSS + Canvas + JavaScript (inga ramverk, ingen bundler)
- PeerJS (CDN) för peer-to-peer multiplayer
- GitHub Pages hosting

## Arkitektur

### Tile Registry (plugin-system)
Lägg till nya tile-typer:
1. Skapa `js/tiles/nytile.js` med `TileRegistry.register('X', { ... })`
2. Lägg till `<script>` i `index.html`
3. Använd tecknet i ban-JSON

### Banformat
JSON-filer i `levels/`. Grid kodas med tecken: `W`=vägg, `.`=golv, `1`/`2`=spawn, `B`=knapp, `D`=dörr, `E`=utgång, `P`=grop.

Länksystem: `"links": { "B@rad,kol": ["D@rad,kol"] }`

### Nätverksmodell
Host-auktoritativ. Host kör simulationen, gäst skickar input och tar emot state.

## Skriptordning
```
config → utils → lang → input → network → tileRegistry →
tiles/* → levelLoader → levelManager → player → gameState →
camera → renderer → ui → audio → game
```

## Deploy
Bumpa `?v=N` i alla script-taggar före push. GitHub Pages serverar direkt.

## GitHub
- Repo: dlindbom/puzzle-teamwork
- Pages: dlindbom.github.io/puzzle-teamwork/
