import Controller from './Controller.js';

export default class HumanController extends Controller {
    constructor(player) {
        super(player);
    }

    update(deltaTime, context) {
        const player = this.player;
        const { input, field, energyDrainPerSecond, energyRecoveryPerSecond } = context;
        const running = input.run && input.move > 0 && !player.exhausted && player.energy > 0;

        if (input.turn || input.move) {
            const angle = Math.atan2(player.direction.y, player.direction.x) +
                input.turn * 2.8 * deltaTime;
            player.direction = { x: Math.cos(angle), y: Math.sin(angle) };

            const speed = running ? player.runningSpeed : player.speed;
            player.move(
                player.direction.x * input.move,
                player.direction.y * input.move,
                speed,
                deltaTime,
                field
            );
        }

        if (running) {
            player.energy = Math.max(0, player.energy - energyDrainPerSecond * deltaTime);
            if (player.energy === 0) player.exhausted = true;
        } else {
            player.energy = Math.min(100, player.energy + energyRecoveryPerSecond * deltaTime);
        }
    }
}
