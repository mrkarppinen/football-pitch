import { GameObjectType } from '../entities/GameObjectType.js';

export default class FootballCollisionHandler {
    constructor(match) {
        this.match = match;
    }

    handle(entityA, entityB) {
        const ball = this.getEntity(entityA, entityB, GameObjectType.BALL);
        if (ball) {
            const boundary = this.getBoundary(entityA, entityB);
            if (boundary) {
                this.handleBoundary(boundary);
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

        this.handleBoundary(this.getBoundary(entityA, entityB));
    }

    getEntity(entityA, entityB, type) {
        if (entityA.type === type) return entityA;
        if (entityB.type === type) return entityB;
        return null;
    }

    getBoundary(entityA, entityB) {
        return [
            entityA,
            entityB
        ].find(entity =>
            entity.type === GameObjectType.SIDELINE ||
            entity.type === GameObjectType.ENDLINE
        ) ?? null;
    }

    handleBoundary(boundary) {
        if (boundary?.type === GameObjectType.SIDELINE) {
            this.match.startSidelineKick(boundary.side);
        } else if (boundary?.type === GameObjectType.ENDLINE) {
            this.match.startEndlineRestart(boundary.side);
        }
    }
}
