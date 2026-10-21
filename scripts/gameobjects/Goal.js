
import GameObject from './GameObject.js';
import { GameObjectType } from './GameObjectType.js';
import CanvasDraw from '../CanvasDraw.js';

export default class Goal extends GameObject {
    constructor(x, y, width, height, ballRadius = 5, goalSide = 'left') {
        super(x, y, 0, GameObjectType.GOAL, [GameObjectType.BALL]);
        this.width = width;
        this.height = height;
        this.goalSide = goalSide;
        this.collisionMaskType = 'rect';
        this.customCollisionMask = {
            x: this.goalSide === 'left' ? this.x : this.x + ballRadius * 2,
            y: this.y,
            width: this.goalSide === 'left' ? this.width - ballRadius * 2 : this.width,
            height: this.height
        };
    }

    render(ctx) {
        CanvasDraw.drawGoal(ctx, this.x, this.y, this.width, this.height);
    }

    onCollide(other) {
        if (other.type === GameObjectType.BALL) this.match.scoreGoal(this);
    }
}