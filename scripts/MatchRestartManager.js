import { MatchStates } from './MatchStateManager.js';

export default class MatchRestartManager {
    constructor({
        field,
        homeTeam,
        awayTeam,
        teams,
        players,
        ball,
        setTeamModes,
        setHumanController,
        attachBallTo,
        changeState
    }) {
        this.field = field;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.teams = teams;
        this.players = players;
        this.ball = ball;
        this.setTeamModes = setTeamModes;
        this.setHumanController = setHumanController;
        this.attachBallTo = attachBallTo;
        this.changeState = changeState;
        this.restartKicker = null;
    }

    getKickoffPlayer(kickoffTeam) {
        return kickoffTeam.players.find(player => player.kickoff);
    }

    startSidelineKick(side, lastTouchTeam) {
        const lastTouchingTeam = lastTouchTeam || this.homeTeam;
        const restartTeam = lastTouchingTeam === this.homeTeam
            ? this.awayTeam
            : this.homeTeam;
        const kicker = restartTeam.fieldPlayers.reduce((nearest, player) => {
            const distance = Math.abs(player.x - this.ball.x);
            return !nearest || distance < nearest.distance ? { player, distance } : nearest;
        }, null).player;
        const isTop = side === 'top';
        const sidelineY = isTop ? this.field.y : this.field.y + this.field.height;
        const kickerX = Math.max(
            this.field.x + kicker.radius,
            Math.min(this.field.x + this.field.width - kicker.radius, this.ball.x)
        );
        const kickerY = isTop ? sidelineY + kicker.radius : sidelineY - kicker.radius;
        this.startRestartKick(
            MatchStates.SIDELINE_KICK,
            kicker,
            kickerX,
            kickerY,
            { x: 0, y: isTop ? 1 : -1 }
        );
    }

    startEndlineRestart(side, lastTouchTeam) {
        const defendingTeam = side === 'left' ? this.homeTeam : this.awayTeam;
        const isCorner = lastTouchTeam === defendingTeam;
        if (isCorner) {
            const restartTeam = defendingTeam === this.homeTeam
                ? this.awayTeam
                : this.homeTeam;
            const referencePlayer = restartTeam.fieldPlayers[0];
            const isTop = this.ball.y < this.field.y + this.field.height / 2;
            const x = side === 'left'
                ? this.field.x + referencePlayer.radius
                : this.field.x + this.field.width - referencePlayer.radius;
            const y = isTop
                ? this.field.y + referencePlayer.radius
                : this.field.y + this.field.height - referencePlayer.radius;
            const kicker = restartTeam.fieldPlayers.reduce((nearest, player) => {
                const distance = Math.hypot(player.x - x, player.y - y);
                return !nearest || distance < nearest.distance ? { player, distance } : nearest;
            }, null).player;
            this.startRestartKick(
                MatchStates.CORNER_KICK,
                kicker,
                x,
                y,
                {
                    x: side === 'left' ? 1 : -1,
                    y: isTop ? 1 : -1
                }
            );
            return;
        }

        const goalkeeper = defendingTeam.goalkeeper;
        const goalAreaDepth = this.field.width * 5.5 / 105;
        const x = side === 'left'
            ? this.field.x + goalAreaDepth / 2
            : this.field.x + this.field.width - goalAreaDepth / 2;
        const y = this.field.y + this.field.height / 2;
        this.startRestartKick(
            MatchStates.GOAL_KICK,
            goalkeeper,
            x,
            y,
            { x: side === 'left' ? 1 : -1, y: 0 }
        );
    }

    startRestartKick(state, kicker, x, y, direction) {
        kicker.x = x;
        kicker.y = y;
        kicker.previousPosition = { x, y };
        kicker.direction = direction;
        this.players.forEach(player => {
            player.hasBall = player === kicker;
            player.kickSpeed = 0;
        });
        this.restartKicker = kicker;
        this.ball.velocity = { x: 0, y: 0 };
        this.setTeamModes(kicker.team);
        this.attachBallTo(kicker);
        this.setHumanController(kicker.team === this.homeTeam ? kicker : null);
        this.changeState(state);
    }

    finishRestartKick() {
        this.restartKicker = null;
    }

    prepareKickOff(kickoffTeam) {
        this.players.forEach(player => {
            player.resetPosition();
            player.energy = 100;
            player.hasBall = false;
            player.kickSpeed = 0;
        });
        this.teams.forEach(team => {
            team.fieldPlayers.forEach(player => {
                player.formationPosition = { x: player.x, y: player.y };
                player.stateTarget = { ...player.formationPosition };
                player.defendAreaRadius = this.field.width * 0.14;
            });
            team.defendAreaRadius = this.field.width * 0.14;
        });

        const kickoffPlayer = this.getKickoffPlayer(kickoffTeam);
        kickoffPlayer.x = this.field.x + this.field.width / 2;
        kickoffPlayer.y = this.field.y + this.field.height / 2;
        kickoffPlayer.previousPosition = { x: kickoffPlayer.x, y: kickoffPlayer.y };
        kickoffPlayer.direction = { x: kickoffPlayer.team.attacksRight ? 1 : -1, y: 0 };
        kickoffPlayer.hasBall = true;
        this.attachBallTo(kickoffPlayer);
        this.ball.velocity = { x: 0, y: 0 };
        this.restartKicker = null;
        this.setHumanController(kickoffPlayer.team === this.homeTeam ? kickoffPlayer : null);
        this.setTeamModes(kickoffTeam);
        this.changeState(MatchStates.KICK_OFF);
    }
}
