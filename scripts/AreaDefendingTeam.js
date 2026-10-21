import Team from './Team.js';
import AiController from './controllers/AiController.js';
import { PlayerStates } from './controllers/PlayerStates.js';

export default class AreaDefendingTeam extends Team {
    constructor(options, { defendAreaRadius = 140 } = {}) {
        super(options);
        this.defendAreaRadius = defendAreaRadius;
    }

    update(deltaTime, context) {
        this.fieldPlayers.forEach(player => {
            player.renderDefendArea = context.input.showDefendArea;
        });
        this.assignPlayerStates(context);
        super.update(deltaTime, context);
    }

    assignPlayerStates(context) {
        const holder = context.players.find(player => player.hasBall);
        for (const player of this.fieldPlayers) {
            player.state = PlayerStates.MAINTAIN_FORMATION_POSITION;
            player.stateTarget = this.getFormationTarget(player, context);
        }

        if (holder?.team === this) {
            holder.state = PlayerStates.ATTACKING_GOAL;
            holder.stateTarget = {
                x: this.attacksRight
                    ? context.field.x + context.field.width
                    : context.field.x,
                y: context.field.y + context.field.height / 2
            };
        }

        const aiPlayers = this.fieldPlayers.filter(player =>
            player.controller instanceof AiController
        );
        const nearestPlayers = [...aiPlayers].sort((first, second) =>
            this.distanceToBall(first, context.ball) - this.distanceToBall(second, context.ball)
        );
        const chaser = holder?.team === this ? null : nearestPlayers[0];
        const support = nearestPlayers.find(player =>
            player !== chaser && player !== holder
        );

        for (const player of aiPlayers) {
            if (player === holder && holder.team === this) continue;

            if (player === chaser) {
                player.state = PlayerStates.CHASING_BALL;
                player.stateTarget = { x: context.ball.x, y: context.ball.y };
            } else if (player === support) {
                player.state = PlayerStates.FORMING_PASSING_LANE;
                player.stateTarget = this.getSupportTarget(player, holder, context);
            }
        }
    }

    distanceToBall(player, ball) {
        return Math.hypot(player.x - ball.x, player.y - ball.y);
    }

    getSupportTarget(player, holder, context) {
        const attackDirection = this.attacksRight ? 1 : -1;
        const laneDirection = holder?.team === this ? attackDirection : -attackDirection;
        const verticalDirection = player.y < context.ball.y ? -1 : 1;
        return {
            x: context.ball.x + laneDirection * this.defendAreaRadius * 0.55,
            y: context.ball.y + verticalDirection * this.defendAreaRadius * 0.45
        };
    }

    getFormationTarget(player, context) {
        const anchor = player.formationPosition;
        const deltaX = context.ball.x - anchor.x;
        const deltaY = context.ball.y - anchor.y;
        let offsetX = deltaX * 0.12;
        let offsetY = deltaY * 0.12;
        const offsetLength = Math.hypot(offsetX, offsetY);

        if (offsetLength > player.defendAreaRadius) {
            const scale = player.defendAreaRadius / offsetLength;
            offsetX *= scale;
            offsetY *= scale;
        }

        return { x: anchor.x + offsetX, y: anchor.y + offsetY };
    }
}
