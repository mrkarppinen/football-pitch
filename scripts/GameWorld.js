import CollisionSystem from './CollisionSystem.js';

export default class GameWorld {
    constructor(collisionSystem = new CollisionSystem()) {
        this.collisionSystem = collisionSystem;
        this.entities = [];
        this.renderables = [];
        this.match = null;
    }

    register(entity, { renderable = false, collidable = false } = {}) {
        if (!this.entities.includes(entity)) this.entities.push(entity);
        if (renderable && !this.renderables.includes(entity)) {
            this.renderables.push(entity);
        }
        if (collidable) this.registerCollider(entity);
        if (this.match) entity.match = this.match;
        return entity;
    }

    registerCollider(entity) {
        this.register(entity);
        this.collisionSystem.register(entity);
        return entity;
    }

    unregister(entity) {
        this.entities = this.entities.filter(candidate => candidate !== entity);
        this.renderables = this.renderables.filter(candidate => candidate !== entity);
        this.collisionSystem.unregister(entity);
        if (entity.match === this.match) entity.match = null;
    }

    setMatch(match) {
        this.match = match;
        this.entities.forEach(entity => {
            entity.match = match;
        });
    }

    updateCollisions() {
        this.collisionSystem.update();
    }
}
