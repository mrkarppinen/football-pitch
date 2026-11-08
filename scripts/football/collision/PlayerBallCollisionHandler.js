import { GameObjectType } from '../entities/GameObjectType.js';

export default class PlayerBallCollisionHandler {
    constructor(players, onPossessionAcquired = () => {}) {
        this.players = players;
        this.onPossessionAcquired = onPossessionAcquired;
    }

    handle(entityA, entityB) {
        const ball = entityA.type === GameObjectType.BALL
            ? entityA
            : entityB.type === GameObjectType.BALL
                ? entityB
                : null;
        const player = entityA.type === GameObjectType.PLAYER
            ? entityA
            : entityB.type === GameObjectType.PLAYER
                ? entityB
                : null;
        if (!ball || !player || !ball.tryAcquirePossession(player, this.players)) return false;

        this.onPossessionAcquired(player);
        return true;
    }
}
