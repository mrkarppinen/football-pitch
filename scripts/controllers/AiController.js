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
            player.direction = { x: deltaX / distance, y: deltaY / distance };
            const speed = player.state.targetKey === 'ball'
                ? player.speed * 1.2
                : player.speed;
            player.move(
                player.direction.x,
                player.direction.y,
                speed,
                deltaTime,
                context.field
            );
        }
    }
}
