import Controller from './Controller.js';

export default class AiController extends Controller {
    constructor(player) {
        super(player);
    }

    update(deltaTime, context) {
        const player = this.player;
        const target = player.stateTarget;
        const deltaX = target.x - player.x;
        const deltaY = target.y - player.y;
        const distance = Math.hypot(deltaX, deltaY);

        player.energy = Math.min(100, player.energy + context.energyRecoveryPerSecond * deltaTime);
        if (!context.input.run) player.exhausted = false;

        if (distance > 1) {
            const movementDirection = player.hasBall
                ? player.direction
                : { x: deltaX / distance, y: deltaY / distance };
            if (!player.hasBall) player.direction = movementDirection;
            const speed = player.state.targetKey === 'ball'
                ? player.speed * 1.2
                : player.speed;
            player.move(
                movementDirection.x,
                movementDirection.y,
                speed,
                deltaTime,
                context.field
            );
        }
    }
}
