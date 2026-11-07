import Player from './Player.js';
import { PlayerStates } from '../controllers/PlayerStates.js';

export default class AreaPlayer extends Player {
    constructor({ defendAreaRadius = 140, ...options }) {
        super(options);
        this.defendAreaRadius = defendAreaRadius;
        this.formationPosition = { x: this.x, y: this.y };
        this.state = PlayerStates.MAINTAIN_FORMATION_POSITION;
        this.stateTarget = { ...this.formationPosition };
        this.renderDefendArea = false
    }

    render(ctx) {
        if (this.renderDefendArea) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.defendAreaRadius, 0, Math.PI * 2);
            ctx.setLineDash([3, 5]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(247, 248, 239, 0.55)';
            ctx.stroke();
            ctx.restore();
        }
        super.render(ctx);
    }
}
