export default class GameObject {
    constructor(x, y, radius, type, collidesWith = []) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
        this.collidesWith = collidesWith;
        this.collisionMaskType = 'circle';
        this.match = null;
    }

    canCollideWith(otherEntity) {
        return this.collidesWith.includes(otherEntity.type);
    }

    update() {}

    onCollide() {}

    render() {}
}
