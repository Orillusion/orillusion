export class Tile {
    offsetX: number;
    offsetY: number;
    level: number;
    tileX: number;
    tileY: number;
    nFaces: number;
    quadKey: string;
    constructor(offsetX: number, offsetY: number, level: number, tileX: number, tileY: number, nFaces: number, quadKey: string) {
        this.offsetX = offsetX;
            this.offsetY = offsetY;
            this.level = level;
            this.tileX = tileX;
            this.tileY = tileY;
            this.nFaces = nFaces;
            this.quadKey = quadKey;
    }
}