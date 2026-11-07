import { GameObjectType } from '../entities/GameObjectType.js';

export default class FootballCollisionHandler {
    constructor(match) {
        this.match = match;
    }

    handle(entityA, entityB) {
        const ball = this.getEntity(entityA, entityB, GameObjectType.BALL);
        if (ball) {
            const player = this.getEntity(entityA, entityB, GameObjectType.PLAYER);
            if (player) {
                this.match.tryAcquirePossession(player);
                return;
            }

            const goalPost = this.getEntity(entityA, entityB, GameObjectType.GOAL_POST);
            if (goalPost) {
                ball.reflectFromPost(goalPost);
                return;
            }

            const goal = this.getEntity(entityA, entityB, GameObjectType.GOAL);
            if (goal) this.match.scoreGoal(goal);
            return;
        }

        const player = entityA.type === GameObjectType.PLAYER ? entityA :
            entityB.type === GameObjectType.PLAYER ? entityB : null;
        if (!player?.hasBall) return;

        const boundary = entityA.type === GameObjectType.SIDELINE ? entityA :
            entityB.type === GameObjectType.SIDELINE ? entityB :
                entityA.type === GameObjectType.ENDLINE ? entityA :
                    entityB.type === GameObjectType.ENDLINE ? entityB : null;
        if (boundary?.type === GameObjectType.SIDELINE) {
            this.match.startSidelineKick(boundary.side);
        } else if (boundary?.type === GameObjectType.ENDLINE) {
            this.match.startEndlineRestart(boundary.side);
        }
    }

    getEntity(entityA, entityB, type) {
        if (entityA.type === type) return entityA;
        if (entityB.type === type) return entityB;
        return null;
    }
}
