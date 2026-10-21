import GameObject from './GameObject.js';
import { GameObjectType } from './GameObjectType.js';

export default class GoalPost extends GameObject {
    constructor(x, y) {
        super(x, y, 4, GameObjectType.GOAL_POST, [GameObjectType.BALL]);
    }
}