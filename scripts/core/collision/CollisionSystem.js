import CollisionDetector from './CollisionDetector.js';

export default class CollisionSystem {
    constructor(detector = new CollisionDetector()) {
        this.entities = [];
        this.detector = detector;
        this.collisionListeners = new Set();
    }

    register(entity) {
        if (!this.entities.includes(entity)) this.entities.push(entity);
    }

    unregister(entity) {
        this.entities = this.entities.filter(candidate => candidate !== entity);
    }

    addCollisionListener(listener) {
        this.collisionListeners.add(listener);
        return () => this.collisionListeners.delete(listener);
    }

    update() {
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const entityA = this.entities[i];
                const entityB = this.entities[j];
                const aCollidesWithB = entityA.canCollideWith(entityB);
                const bCollidesWithA = entityB.canCollideWith(entityA);

                if (
                    (aCollidesWithB || bCollidesWithA) &&
                    this.checkCollision(entityA, entityB)
                ) {
                    if (aCollidesWithB) entityA.onCollide(entityB);
                    if (bCollidesWithA) entityB.onCollide(entityA);
                    this.collisionListeners.forEach(listener =>
                        listener(entityA, entityB)
                    );
                }
            }
        }
    }

    checkCollision(entityA, entityB) {
        return this.detector.checkCollision(entityA, entityB);
    }
}
