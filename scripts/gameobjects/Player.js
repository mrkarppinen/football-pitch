import { GameObjectType } from './GameObjectType.js';
import GameObject from './GameObject.js';
import CanvasDraw from '../CanvasDraw.js';
import Controller from '../controllers/Controller.js';
import { PlayerStates } from '../controllers/PlayerStates.js';

export default class Player extends GameObject {
    constructor({
        id,
        name,
        team,
        role = 'attack',
        x,
        y,
        direction,
        kickoff = false,
        speed = 120,
        runningSpeed = 240,
        radius = 10
    }) {
        super(x, y, radius, GameObjectType.PLAYER, [GameObjectType.PLAYER, GameObjectType.BALL]);
        this.id = id;
        this.name = name;
        this.team = team;
        this.role = role;
        this.kickoff = kickoff;
        this.speed = speed;
        this.runningSpeed = runningSpeed;
        this.direction = direction;
        this.hasBall = false;
        this.energy = 100;
        this.exhausted = false;
        this.kickSpeed = 0;
        this.previousPosition = { x, y };
        this.initialPosition = { x, y, direction: { ...direction } };
        this.controller = new Controller(this);
        this.state = PlayerStates.MAINTAIN_FORMATION_POSITION;
        this.formationPosition = { x, y };
        this.stateTarget = { x, y };
        this.defendAreaRadius = 0;
    }

    resetPosition() {
        this.x = this.initialPosition.x;
        this.y = this.initialPosition.y;
        this.direction = { ...this.initialPosition.direction };
        this.previousPosition = { x: this.x, y: this.y };
    }

    update(deltaTime, context) {
        if (context.goalkeeperPossession) {
            if (this.team !== context.goalkeeperTeam) {
                this.moveOutsidePenaltyArea(deltaTime, context);
            }
            return;
        }

        this.controller.update(deltaTime, context);
    }

    moveOutsidePenaltyArea(deltaTime, context) {
        const { penaltyArea, field } = context;
        const isInside = this.x >= penaltyArea.minX &&
            this.x <= penaltyArea.maxX &&
            this.y >= penaltyArea.minY &&
            this.y <= penaltyArea.maxY;
        if (!isInside) return;

        const targetX = penaltyArea.side === 'left'
            ? penaltyArea.maxX + this.radius + 2
            : penaltyArea.minX - this.radius - 2;
        const directionX = Math.sign(targetX - this.x);
        this.direction = { x: directionX, y: 0 };
        this.move(directionX, 0, Math.max(this.speed, 180), deltaTime, field);
    }

    move(directionX, directionY, speed, deltaTime, field) {
        const minX = field.x + this.radius;
        const maxX = field.x + field.width - this.radius;
        const minY = field.y + this.radius;
        const maxY = field.y + field.height - this.radius;
        this.x = Math.max(minX, Math.min(maxX, this.x + directionX * speed * deltaTime));
        this.y = Math.max(minY, Math.min(maxY, this.y + directionY * speed * deltaTime));
    }

    kickBall(ball) {
        const directionLength = Math.hypot(this.direction.x, this.direction.y) || 1;
        ball.x = this.x + this.direction.x * 12;
        ball.y = this.y + this.direction.y * 12;
        ball.previousPosition = { x: ball.x, y: ball.y };
        ball.velocity = {
            x: (this.direction.x / directionLength) * this.kickSpeed,
            y: (this.direction.y / directionLength) * this.kickSpeed
        };
        this.hasBall = false;
        this.kickSpeed = 0;
    }

    onCollide(other) {
        if (other.type === GameObjectType.PLAYER) {
            const movementX = this.x - this.previousPosition.x;
            const movementY = this.y - this.previousPosition.y;
            const towardOtherX = other.previousPosition.x - this.previousPosition.x;
            const towardOtherY = other.previousPosition.y - this.previousPosition.y;
            const startDistance = Math.hypot(towardOtherX, towardOtherY);
            const currentDistance = Math.hypot(this.x - other.x, this.y - other.y);
            const movingTowardOther =
                movementX * towardOtherX + movementY * towardOtherY > 0;

            if (
                movingTowardOther &&
                startDistance > currentDistance &&
                currentDistance < this.radius + other.radius
            ) {
                this.x = this.previousPosition.x;
                this.y = this.previousPosition.y;
            }
        }
    }

    render(ctx) {
        CanvasDraw.drawPlayer(ctx, this);
    }
}
