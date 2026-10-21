import GameObject from './gameobjects/GameObject.js';
import { GameObjectType } from './gameobjects/GameObjectType.js';

export const TeamModes = {
    DEFENCE: 'defence',
    ATTACK: 'attack'
};

export default class Team extends GameObject {
    constructor({
        name,
        playerColor,
        goalKeeperColor,
        attacksRight,
        mode = TeamModes.DEFENCE
    }) {
        super(0, 0, 0, GameObjectType.TEAM);
        this.name = name;
        this.playerColor = playerColor;
        this.goalKeeperColor = goalKeeperColor;
        this.attacksRight = Boolean(attacksRight);
        this.players = [];
        this.mode = mode;
    }

    get mode() {
        return this._mode;
    }

    set mode(value) {
        if (!Object.values(TeamModes).includes(value)) {
            throw new RangeError(`Invalid team mode: ${value}`);
        }
        this._mode = value;
    }

    addPlayer(player) {
        if (player.team !== this) {
            throw new Error(`Player ${player.name} must belong to ${this.name}`);
        }
        this.players.push(player);
        return player;
    }

    update(deltaTime, context) {
        this.players.forEach(player => {
            player.previousPosition = { x: player.x, y: player.y };
            player.update(deltaTime, context);
        });
    }

    render(ctx) {
        this.players.forEach(player => player.render(ctx));
    }

    get goalkeeper() {
        return this.players.find(player => player.isGoalkeeper) ?? null;
    }

    get fieldPlayers() {
        return this.players.filter(player => !player.isGoalkeeper);
    }
}
