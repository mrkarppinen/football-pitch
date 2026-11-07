import GameObject from './GameObject.js';
import { GameObjectType } from './GameObjectType.js';

export default class Sideline extends GameObject {
    constructor(x, y, width, height, side) {
        super(x, y, 0, GameObjectType.SIDELINE, [
            GameObjectType.BALL,
            GameObjectType.PLAYER
        ]);
        this.width = width;
        this.height = height;
        this.side = side;
        this.collisionMaskType = 'rect';
    }

}
