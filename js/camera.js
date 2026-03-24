// Puzzle Teamwork — Kamera/Viewport

const Camera = {
    offsetX: 0,
    offsetY: 0,

    /**
     * Centrera griden på canvas.
     */
    center: function(cols, rows, tileSize, canvasW, canvasH) {
        this.offsetX = Math.floor((canvasW - cols * tileSize) / 2);
        this.offsetY = Math.floor((canvasH - rows * tileSize) / 2);
    },

    /**
     * Omvandla grid-koordinat till skärm-koordinat.
     */
    gridToScreen: function(col, row, tileSize) {
        return {
            x: this.offsetX + col * tileSize,
            y: this.offsetY + row * tileSize
        };
    }
};
