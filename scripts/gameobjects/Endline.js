import GameObject from './GameObject.js';
import { GameObjectType } from './GameObjectType.js';

export default class Endline extends GameObject {
    constructor(x, y, width, height, side) {
        super(x, y, 0, GameObjectType.ENDLINE, [
            GameObjectType.BALL,
            GameObjectType.PLAYER
        ]);
        this.width = width;
        this.height = height;
        this.side = side;
        this.collisionMaskType = 'rect';
    }

    onCollide(other) {
        if (other.type === GameObjectType.BALL || other.hasBall) {
            this.match.startEndlineRestart(this.side);
        }
    }
}
