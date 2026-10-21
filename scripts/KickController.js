const AI_KICK_CHANCE_PER_SECOND = 0.4;
const MAX_KICK_SPEED = 700;
const MIN_KICK_SPEED = 220;

export const KICK_CHARGE_DURATION = 0.5;

export default class KickController {
    constructor(field) {
        this.field = field;
    }

    chargeHumanKick(player, currentChargeTime, deltaTime) {
        const chargeTime = Math.min(KICK_CHARGE_DURATION, currentChargeTime + deltaTime);
        player.kickSpeed = MIN_KICK_SPEED +
            (MAX_KICK_SPEED - MIN_KICK_SPEED) * (chargeTime / KICK_CHARGE_DURATION);
        return chargeTime;
    }

    tryKick(player, deltaTime, releaseKick) {
        const kickChance = 1 - (1 - AI_KICK_CHANCE_PER_SECOND) ** deltaTime;
        if (Math.random() >= kickChance) return false;

        this.aim(player);
        releaseKick(player);
        return true;
    }

    aim(player) {
        const choices = [
            { weight: 0.45, target: this.getOpponentGoalTarget(player.team) },
            { weight: 0.4, target: this.getTeammateTarget(player) },
            { weight: 0.15, target: this.getGoalkeeperTarget(player) }
        ].filter(choice => choice.target);
        const totalWeight = choices.reduce((total, choice) => total + choice.weight, 0);
        let selection = Math.random() * totalWeight;
        const choice = choices.find(candidate => {
            selection -= candidate.weight;
            return selection < 0;
        }) || choices[choices.length - 1];
        const deltaX = choice.target.x - player.x;
        const deltaY = choice.target.y - player.y;
        const distance = Math.hypot(deltaX, deltaY) || 1;
        player.direction = { x: deltaX / distance, y: deltaY / distance };
        player.kickSpeed = MAX_KICK_SPEED;
    }

    getOpponentGoalTarget(team) {
        return {
            x: team.attacksRight ? this.field.x + this.field.width : this.field.x,
            y: this.field.y + this.field.height / 2
        };
    }

    getTeammateTarget(player) {
        const teammates = player.team.fieldPlayers.filter(candidate => candidate !== player);
        return this.getNearestPlayer(teammates, player.x, player.y);
    }

    getGoalkeeperTarget(player) {
        const goalkeeper = player.team.goalkeeper;
        return goalkeeper !== player ? goalkeeper : null;
    }

    getNearestPlayer(players, x, y) {
        return players.reduce((nearest, player) => {
            const distance = Math.hypot(player.x - x, player.y - y);
            return !nearest || distance < nearest.distance
                ? { player, distance }
                : nearest;
        }, null)?.player ?? null;
    }
}
