import CollisionSystem from './collision/CollisionSystem.js';

export default class GameWorld {
    constructor(collisionSystem = new CollisionSystem()) {
        this.collisionSystem = collisionSystem;
        this.entities = [];
        this.renderables = [];
    }

    register(entity, { renderable = false, collidable = false } = {}) {
        if (!this.entities.includes(entity)) this.entities.push(entity);
        if (renderable && !this.renderables.includes(entity)) {
            this.renderables.push(entity);
        }
        if (collidable) this.registerCollider(entity);
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
    }

    updateCollisions() {
        this.collisionSystem.update();
    }
}
