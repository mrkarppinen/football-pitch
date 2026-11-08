import Team from './Team.js';
import AiController from '../controllers/AiController.js';
import { PlayerStates } from '../controllers/PlayerStates.js';

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
        const defending = holder?.team !== this;
        const candidates = defending
            ? this.getDefensiveChaserCandidates(aiPlayers, context)
            : aiPlayers;
        const chaser = defending ? this.getNearestToBall(candidates, context.ball) : null;
        const supportCandidates = aiPlayers.filter(player =>
            player !== chaser && player !== holder && player.role !== 'defence'
        );
        const support = this.getNearestToBall(supportCandidates, context.ball);

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

    getDefensiveChaserCandidates(aiPlayers, context) {
        const midfielders = aiPlayers.filter(player => player.role === 'midfield');
        const defenders = aiPlayers.filter(player => player.role === 'defence');
        if (this.isBallInDefensiveThird(context.ball, context.field)) {
            return [...midfielders, ...defenders];
        }
        return midfielders.length ? midfielders : aiPlayers;
    }

    isBallInDefensiveThird(ball, field) {
        const defensiveThirdBoundary = this.attacksRight
            ? field.x + field.width * 0.35
            : field.x + field.width * 0.65;
        return this.attacksRight
            ? ball.x <= defensiveThirdBoundary
            : ball.x >= defensiveThirdBoundary;
    }

    getNearestToBall(players, ball) {
        return [...players].sort((first, second) =>
            this.distanceToBall(first, ball) - this.distanceToBall(second, ball)
        )[0] ?? null;
    }

    distanceToBall(player, ball) {
        return Math.hypot(player.x - ball.x, player.y - ball.y);
    }

    getSupportTarget(player, holder, context) {
        const attackDirection = this.attacksRight ? 1 : -1;
        const laneDirection = holder?.team === this ? attackDirection : -attackDirection;
        const verticalDirection = player.y < context.ball.y ? -1 : 1;
        const forwardDistance = player.role === 'attack'
            ? this.defendAreaRadius * 0.85
            : this.defendAreaRadius * 0.55;
        return {
            x: context.ball.x + laneDirection * forwardDistance,
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
