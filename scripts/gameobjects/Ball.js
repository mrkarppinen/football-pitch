import { GameObjectType } from './GameObjectType.js';
import GameObject from './GameObject.js';
import CanvasDraw from '../CanvasDraw.js';

const PICKUP_GRACE_PERIOD = 0.35;
const POSSESSION_GRACE_PERIOD = 2;

export default class Ball extends GameObject {
    constructor(x, y, { friction = 0.98, radius = 5, pickupRadius = 15 } = {}) {
        super(x, y, radius, GameObjectType.BALL, [
            GameObjectType.PLAYER,
            GameObjectType.GOAL_POST,
            GameObjectType.GOAL
        ]);
        this.friction = friction;
        this.pickupRadius = pickupRadius;
        this.velocity = { x: 0, y: 0 };
        this.previousPosition = { x, y };
        this.sweptCollision = true;
        this.canAcquirePossession = false;
        this.lastKicker = null;
        this.kickPickupGraceRemaining = 0;
        this.possessionGraceRemaining = 0;
    }

    update(deltaTime, holder, field) {
        this.kickPickupGraceRemaining = Math.max(
            0,
            this.kickPickupGraceRemaining - deltaTime
        );
        this.possessionGraceRemaining = Math.max(
            0,
            this.possessionGraceRemaining - deltaTime
        );
        this.previousPosition = { x: this.x, y: this.y };

        if (holder) {
            this.x = holder.x + holder.direction.x * 12;
            this.y = holder.y + holder.direction.y * 12;
            this.velocity.x = 0;
            this.velocity.y = 0;
            return;
        }

        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        const friction = Math.pow(this.friction, deltaTime * 60);
        this.velocity.x *= friction;
        this.velocity.y *= friction;

        this.x = Math.max(0, Math.min(field.canvasWidth, this.x));
        this.y = Math.max(0, Math.min(field.canvasHeight, this.y));

        if (Math.hypot(this.velocity.x, this.velocity.y) < 8) {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    setCanAcquirePossession(canAcquire) {
        this.canAcquirePossession = canAcquire;
        if (!canAcquire) {
            this.lastKicker = null;
            this.kickPickupGraceRemaining = 0;
            this.possessionGraceRemaining = 0;
        }
    }

    canBeAcquiredBy(player) {
        return this.canAcquirePossession &&
            !(player === this.lastKicker && this.kickPickupGraceRemaining > 0) &&
            this.possessionGraceRemaining === 0;
    }

    tryAcquirePossession(player, players) {
        if (!this.canBeAcquiredBy(player)) return false;

        players.forEach(candidate => {
            candidate.hasBall = candidate === player;
        });
        this.velocity = { x: 0, y: 0 };
        this.attachTo(player);
        this.lastKicker = null;
        this.kickPickupGraceRemaining = 0;
        this.possessionGraceRemaining = POSSESSION_GRACE_PERIOD;
        return true;
    }

    setPossession(player, players) {
        players.forEach(candidate => {
            candidate.hasBall = candidate === player;
        });
        this.velocity = { x: 0, y: 0 };
        this.attachTo(player);
        this.lastKicker = null;
        this.kickPickupGraceRemaining = 0;
        this.possessionGraceRemaining = 0;
    }

    recordKick(player) {
        this.lastKicker = player;
        this.kickPickupGraceRemaining = PICKUP_GRACE_PERIOD;
        this.possessionGraceRemaining = 0;
    }

    attachTo(player) {
        this.x = player.x + player.direction.x * 12;
        this.y = player.y + player.direction.y * 12;
        this.previousPosition = { x: this.x, y: this.y };
    }

    onCollide(other) {
        if (other.type === GameObjectType.PLAYER) {
            this.match.tryAcquirePossession(other);
        } else if (other.type === GameObjectType.GOAL_POST) {
            this.reflectFromPost(other);
        }
    }

    reflectFromPost(post) {
        const deltaX = this.x - this.previousPosition.x;
        const deltaY = this.y - this.previousPosition.y;
        const lengthSquared = deltaX * deltaX + deltaY * deltaY;
        const projection = lengthSquared
            ? Math.max(
                0,
                Math.min(
                    1,
                    ((post.x - this.previousPosition.x) * deltaX +
                        (post.y - this.previousPosition.y) * deltaY) /
                        lengthSquared
                )
            )
            : 1;
        const impactX = this.previousPosition.x + projection * deltaX;
        const impactY = this.previousPosition.y + projection * deltaY;
        let normalX = impactX - post.x;
        let normalY = impactY - post.y;
        const distance = Math.hypot(normalX, normalY);

        if (distance === 0) {
            const speed = Math.hypot(this.velocity.x, this.velocity.y) || 1;
            normalX = -this.velocity.x / speed;
            normalY = -this.velocity.y / speed;
        } else {
            normalX /= distance;
            normalY /= distance;
        }

        const velocityAlongNormal = this.velocity.x * normalX + this.velocity.y * normalY;
        if (velocityAlongNormal < 0) {
            this.velocity.x -= 2 * velocityAlongNormal * normalX;
            this.velocity.y -= 2 * velocityAlongNormal * normalY;
        }

        this.x = impactX + normalX * (this.radius + post.radius);
        this.y = impactY + normalY * (this.radius + post.radius);
    }

    render(ctx) {
        CanvasDraw.drawBall(ctx, this);
    }
}
