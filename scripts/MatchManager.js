import AiController from './controllers/AiController.js';
import HumanController from './controllers/HumanController.js';
import KickController, { KICK_CHARGE_DURATION } from './KickController.js';
import MatchRestartManager from './MatchRestartManager.js';
import MatchStateManager, { MatchStates } from './MatchStateManager.js';
import { TeamModes } from './Team.js';

export { MatchStates };

const ENERGY_DRAIN_PER_SECOND = 40;
const ENERGY_RECOVERY_PER_SECOND = 10;
const GOAL_CELEBRATION_DURATION = 2;
const GOALKEEPER_CLEARANCE_SPEED = 450;

export default class MatchManager {
    constructor({
        field,
        canvasWidth,
        canvasHeight,
        homeTeam,
        awayTeam,
        ball,
        updateCollisions
    }) {
        this.field = field;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.teams = [homeTeam, awayTeam];
        this.players = this.teams.flatMap(team => team.players);
        this.ball = ball;
        this.updateCollisions = updateCollisions;
        this.stateManager = new MatchStateManager(MatchStates.KICK_OFF);
        this.kickController = new KickController(field);
        this.kickoffTeam = this.homeTeam;
        this.score = { home: 0, away: 0 };
        this.kickChargeTime = 0;
        this.lastTouchTeam = this.kickoffTeam;
        this.celebrationRemaining = 0;
        this.activeGoalkeeper = null;
        this.kickWasPressed = false;

        this.restartManager = new MatchRestartManager({
            field: this.field,
            homeTeam: this.homeTeam,
            awayTeam: this.awayTeam,
            teams: this.teams,
            players: this.players,
            ball: this.ball,
            setTeamModes: team => this.setTeamModes(team),
            setHumanController: player => this.setHumanController(player),
            attachBallTo: player => this.attachBallTo(player),
            changeState: state => this.changeState(state)
        });
        this.ball.setCanAcquirePossession(false);
        this.prepareKickOff();
        this.statusText = this.getStatusText();
    }

    setTeamModes(attackingTeam) {
        this.teams.forEach(team => {
            team.mode = team === attackingTeam ? TeamModes.ATTACK : TeamModes.DEFENCE;
        });
    }


    update(deltaTime, input) {
        if (this.currentState === MatchStates.GOAL_CELEBRATION) {
            this.celebrationRemaining -= deltaTime;
            if (this.celebrationRemaining <= 0) this.prepareKickOff();
            return;
        }

        if (this.currentState === MatchStates.KICK_OFF) {
            this.updateKickOff(deltaTime, input);
            this.statusText = this.getStatusText();
            return;
        }

        if (this.isRestartState()) {
            this.updateRestartKick(deltaTime, input);
            this.statusText = this.getStatusText();
            return;
        }

        if (this.currentState === MatchStates.GOALKEEPER_POSSESSION) {
            this.updateGoalkeeperPossession(deltaTime, input);
            this.statusText = this.getStatusText();
            return;
        }

        const currentHolder = this.players.find(player => player.hasBall);
        if (currentHolder?.team === this.homeTeam) {
            this.setHumanController(currentHolder);
        } else {
            this.updateHumanController();
        }

        const context = {
            input,
            players: this.players,
            ball: this.ball,
            field: this.field,
            energyDrainPerSecond: ENERGY_DRAIN_PER_SECOND,
            energyRecoveryPerSecond: ENERGY_RECOVERY_PER_SECOND,
            matchState: this.currentState
        };
        this.teams.forEach(team => team.update(deltaTime, context));

        const holder = this.players.find(player => player.hasBall);
        if (holder && holder.controller instanceof HumanController && input.kick) {
            this.kickChargeTime = this.kickController.chargeHumanKick(
                holder,
                this.kickChargeTime,
                deltaTime
            );
        } else if (holder && holder.controller instanceof AiController) {
            this.tryAiKick(holder, deltaTime);
        } else if (this.kickChargeTime > 0) {
            if (holder) this.releaseKick(holder);
            this.kickChargeTime = 0;
        }

        this.ball.update(
            deltaTime,
            this.players.find(player => player.hasBall),
            { canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight }
        );
        this.updateCollisions();

        this.statusText = this.getStatusText();
    }

    updateKickOff(deltaTime, input) {
        const kickoffPlayer = this.getKickoffPlayer();
        if (kickoffPlayer.controller instanceof HumanController) {
            this.turnPlayer(kickoffPlayer, input.turn, deltaTime);
            this.updateHumanKick(kickoffPlayer, input, deltaTime);
        } else {
            this.tryAiKick(kickoffPlayer, deltaTime);
        }
        this.kickWasPressed = input.kick;
        if (this.currentState === MatchStates.KICK_OFF) this.attachBallTo(kickoffPlayer);
    }

    updateRestartKick(deltaTime, input) {
        const kicker = this.restartManager.restartKicker;
        if (kicker.controller instanceof HumanController) {
            this.turnPlayer(kicker, input.turn, deltaTime);
            this.updateHumanKick(kicker, input, deltaTime);
        } else {
            this.tryAiKick(kicker, deltaTime);
        }

        if (!kicker.hasBall) {
            this.kickChargeTime = 0;
            this.restartManager.finishRestartKick();
            this.changeState(MatchStates.MATCH_ON);
        }
        this.kickWasPressed = input.kick;
        if (this.currentState !== MatchStates.MATCH_ON) this.attachBallTo(kicker);
    }

    turnPlayer(player, turn, deltaTime) {
        const angle = Math.atan2(player.direction.y, player.direction.x) +
            turn * 2.8 * deltaTime;
        player.direction = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    updateHumanKick(player, input, deltaTime) {
        if (input.kick) {
            this.kickChargeTime = this.kickController.chargeHumanKick(
                player,
                this.kickChargeTime,
                deltaTime
            );
        } else if (this.kickWasPressed) {
            this.releaseKick(player);
            this.kickChargeTime = 0;
        }
    }

    tryAiKick(player, deltaTime) {
        return this.kickController.tryKick(
            player,
            deltaTime,
            target => this.releaseKick(target)
        );
    }

    getKickoffPlayer() {
        return this.restartManager.getKickoffPlayer(this.kickoffTeam);
    }

    getNearestPlayer(players, x, y) {
        return players.reduce((nearest, player) => {
            const distance = Math.hypot(player.x - x, player.y - y);
            return !nearest || distance < nearest.distance
                ? { player, distance }
                : nearest;
        }, null)?.player ?? null;
    }

    updateGoalkeeperPossession(deltaTime, input) {
        const penaltyArea = this.getPenaltyArea(this.activeGoalkeeper.goalSide);
        const context = {
            input,
            players: this.players,
            ball: this.ball,
            field: this.field,
            goalkeeperPossession: true,
            activeGoalkeeper: this.activeGoalkeeper,
            goalkeeperTeam: this.activeGoalkeeper.team,
            penaltyArea
        };

        this.teams.forEach(team => team.update(deltaTime, context));

        const goalkeeper = this.activeGoalkeeper;
        const opponentsCleared = this.players
            .filter(player => player.team !== goalkeeper.team)
            .every(player => !this.isInsidePenaltyArea(player, penaltyArea));

        if (goalkeeper.controller instanceof HumanController) {
            if (opponentsCleared) {
                if (input.kick) {
                    this.kickChargeTime = this.kickController.chargeHumanKick(
                        goalkeeper,
                        this.kickChargeTime,
                        deltaTime
                    );
                } else if (this.kickWasPressed) {
                    this.activeGoalkeeper = null;
                    this.releaseKick(goalkeeper, { selectTeammate: false });
                    this.kickChargeTime = 0;
                    this.changeState(MatchStates.MATCH_ON);
                }
            }
            this.kickWasPressed = input.kick;
            if (this.currentState === MatchStates.GOALKEEPER_POSSESSION) {
                this.attachBallTo(goalkeeper);
            }
            return;
        }

        if (opponentsCleared) {
            this.kickController.aim(goalkeeper);
            goalkeeper.kickSpeed = Math.max(
                goalkeeper.kickSpeed,
                GOALKEEPER_CLEARANCE_SPEED
            );
            this.activeGoalkeeper = null;
            this.releaseKick(goalkeeper, { selectTeammate: false });
            this.changeState(MatchStates.MATCH_ON);
        } else {
            this.attachBallTo(goalkeeper);
        }
    }

    getPenaltyArea(goalSide) {
        const depth = this.field.width * 16.5 / 105;
        const height = this.field.height * 40.3 / 68;
        const centerY = this.field.y + this.field.height / 2;
        const leftSide = goalSide === 'left';
        return {
            side: goalSide,
            minX: leftSide ? this.field.x : this.field.x + this.field.width - depth,
            maxX: leftSide ? this.field.x + depth : this.field.x + this.field.width,
            minY: centerY - height / 2,
            maxY: centerY + height / 2
        };
    }

    isInsidePenaltyArea(player, penaltyArea) {
        return player.x >= penaltyArea.minX &&
            player.x <= penaltyArea.maxX &&
            player.y >= penaltyArea.minY &&
            player.y <= penaltyArea.maxY;
    }

    isRestartState(state = this.currentState) {
        return [
            MatchStates.SIDELINE_KICK,
            MatchStates.CORNER_KICK,
            MatchStates.GOAL_KICK
        ].includes(state);
    }

    tryAcquirePossession(player) {
        if (!this.ball.tryAcquirePossession(player, this.players)) return;
        this.lastTouchTeam = player.team;
        this.kickChargeTime = 0;
        if (player.team === this.homeTeam) {
            this.setHumanController(player);
        } else {
            this.updateHumanController();
        }
        if (player.isGoalkeeper) {
            this.startGoalkeeperPossession(player);
            if (player.team === this.homeTeam) {
                this.setHumanController(player);
            }
        } else {
            this.setTeamModes(player.team);
        }
    }

    startGoalkeeperPossession(goalkeeper) {
        this.activeGoalkeeper = goalkeeper;
        this.kickChargeTime = 0;
        this.setTeamModes(this.getOpponentTeam(goalkeeper.team));
        this.changeState(MatchStates.GOALKEEPER_POSSESSION);
    }

    setPossession(player) {
        if (this.currentState !== MatchStates.MATCH_ON || player.team !== this.homeTeam) return;
        this.ball.setPossession(player, this.players);
        this.setHumanController(player);
        this.lastTouchTeam = player.team;
        this.kickChargeTime = 0;
        this.setTeamModes(player.team);
        if (player.isGoalkeeper) this.startGoalkeeperPossession(player);
    }

    getOpponentTeam(team) {
        return team === this.homeTeam ? this.awayTeam : this.homeTeam;
    }

    attachBallTo(player) {
        this.ball.x = player.x + player.direction.x * 12;
        this.ball.y = player.y + player.direction.y * 12;
        this.ball.previousPosition = { x: this.ball.x, y: this.ball.y };
    }

    setHumanController(player) {
        const controlledPlayer = player?.team === this.homeTeam
            ? player
            : this.getNearestPlayer(this.homeTeam.players, this.ball.x, this.ball.y);
        this.homeTeam.players.forEach(candidate => {
            if (candidate === controlledPlayer) {
                if (!(candidate.controller instanceof HumanController)) {
                    candidate.controller = new HumanController(candidate);
                }
            } else if (!(candidate.controller instanceof AiController)) {
                candidate.controller = new AiController(candidate);
            }
        });
    }

    updateHumanController() {
        const humanPossession = this.homeTeam.players.find(player => player.hasBall);
        if (humanPossession) {
            this.setHumanController(humanPossession);
            return;
        }
        this.setHumanController(this.getNearestPlayer(
            this.homeTeam.players,
            this.ball.x,
            this.ball.y
        ));
    }

    releaseKick(player, { selectTeammate = true } = {}) {
        player.kickBall(this.ball);
        this.ball.recordKick(player);
        this.lastTouchTeam = player.team;

        if (selectTeammate && player.team === this.homeTeam) {
            this.updateHumanController();
        }
        this.setTeamModes(player.team);
        if (this.currentState === MatchStates.KICK_OFF) {
            this.changeState(MatchStates.MATCH_ON);
        }
    }

    startSidelineKick(side) {
        if (this.currentState !== MatchStates.MATCH_ON) return;
        this.kickChargeTime = 0;
        this.kickWasPressed = false;
        this.restartManager.startSidelineKick(side, this.lastTouchTeam);
    }

    startEndlineRestart(side) {
        if (this.currentState !== MatchStates.MATCH_ON) return;
        this.kickChargeTime = 0;
        this.kickWasPressed = false;
        this.restartManager.startEndlineRestart(side, this.lastTouchTeam);
    }

    scoreGoal(goal) {
        if (this.currentState !== MatchStates.MATCH_ON) return;
        const scoringTeam = goal.goalSide === 'right' ? this.homeTeam : this.awayTeam;
        this.score[scoringTeam === this.homeTeam ? 'home' : 'away'] += 1;
        this.kickoffTeam = this.getOpponentTeam(scoringTeam);
        this.setTeamModes(this.kickoffTeam);
        this.players.forEach(player => {
            player.hasBall = false;
            player.kickSpeed = 0;
        });
        this.activeGoalkeeper = null;
        this.ball.velocity = { x: 0, y: 0 };
        this.kickChargeTime = 0;
        this.celebrationRemaining = GOAL_CELEBRATION_DURATION;
        this.changeState(MatchStates.GOAL_CELEBRATION);
    }

    prepareKickOff() {
        this.kickChargeTime = 0;
        this.lastTouchTeam = this.kickoffTeam;
        this.kickWasPressed = false;
        this.restartManager.prepareKickOff(this.kickoffTeam);
    }

    get restartKicker() {
        return this.restartManager.restartKicker;
    }

    changeState(newState) {
        this.stateManager.transitionTo(newState);
        this.ball.setCanAcquirePossession(newState === MatchStates.MATCH_ON);
        this.statusText = this.getStatusText();
    }

    get currentState() {
        return this.stateManager.currentState;
    }

    getStatusText() {
        const score = `Home ${this.score.home} - ${this.score.away} Away`;
        if (this.currentState === MatchStates.GOAL_CELEBRATION) return `${score} - GOAL!`;
        if (this.currentState === MatchStates.GOALKEEPER_POSSESSION) {
            return `${score} - ${this.activeGoalkeeper.name} has the ball; opponents must leave the penalty area`;
        }
        if (this.currentState === MatchStates.KICK_OFF) {
            const player = this.getKickoffPlayer();
            const charge = Math.round((this.kickChargeTime / KICK_CHARGE_DURATION) * 100);
            return `${score} - ${player.team.name} kick-off: ${player.name} — Left/Right to rotate, hold/release Space to kick (${charge}%)`;
        }
        if (this.isRestartState()) {
            const charge = Math.round((this.kickChargeTime / KICK_CHARGE_DURATION) * 100);
            const restartLabel = this.currentState === MatchStates.SIDELINE_KICK
                ? 'sideline kick'
                : this.currentState === MatchStates.CORNER_KICK
                    ? 'corner kick'
                    : 'goal kick';
            return `${score} - ${this.restartKicker.team.name} ${restartLabel}: ${this.restartKicker.name} — Left/Right to rotate, hold/release Space to kick (${charge}%)`;
        }
        return `${score} - Arrows: move/turn, S: sprint, Space: charge/release kick`;
    }

}
