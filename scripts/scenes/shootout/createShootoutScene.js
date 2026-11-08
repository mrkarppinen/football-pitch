import GameWorld from '../../core/GameWorld.js';
import PlayerBallCollisionHandler from '../../football/collision/PlayerBallCollisionHandler.js';
import AiController from '../../football/controllers/AiController.js';
import HumanController from '../../football/controllers/HumanController.js';
import Player from '../../football/entities/Player.js';
import Goalkeeper from '../../football/entities/Goalkeeper.js';
import Ball from '../../football/entities/Ball.js';
import Goal from '../../football/entities/Goal.js';
import Pitch from '../../football/entities/Pitch.js';
import Team, { TeamModes } from '../../football/teams/Team.js';
import FootballCollisionHandler from '../../football/match/FootballCollisionHandler.js';
import KickController, {
    GOALKEEPER_CLEARANCE_SPEED,
    KICK_CHARGE_DURATION
} from '../../football/match/KickController.js';
import createBoundaries from '../football-match/createBoundaries.js';
import { AI_GOALKEEPER_SPEED } from '../football-match/settings.js';

const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 680;
const FIELD = Object.freeze({
    x: 25,
    y: 16.19,
    width: 1000,
    height: 647.62
});

export default function createShootoutScene() {
    const field = { ...FIELD, canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT };
    const homeTeam = new Team({
        name: 'Shooter',
        playerColor: '#2735F5',
        goalKeeperColor: '#f1d83c',
        attacksRight: true,
        mode: TeamModes.ATTACK
    });
    const awayTeam = new Team({
        name: 'Goalkeeper',
        playerColor: '#DC9450',
        goalKeeperColor: '#e84b5f',
        attacksRight: false,
        mode: TeamModes.DEFENCE
    });
    const shooter = homeTeam.addPlayer(new Player({
        id: 1,
        name: 'Shooter',
        team: homeTeam,
        x: field.x + field.width * 0.75,
        y: field.y + field.height / 2,
        direction: { x: 1, y: 0 }
    }));
    shooter.controller = new HumanController(shooter);

    const goalMouthHeight = field.width * 7.32 / 105;
    const goalkeeper = awayTeam.addPlayer(new Goalkeeper({
        id: 2,
        name: 'Goalkeeper',
        team: awayTeam,
        goalSide: 'right',
        field,
        goalMouthHeight,
        speed: AI_GOALKEEPER_SPEED
    }));
    goalkeeper.controller = new AiController(goalkeeper);

    const players = [shooter, goalkeeper];
    const ball = new Ball(shooter.x, shooter.y);
    ball.setPossession(shooter, players);
    ball.setCanAcquirePossession(false);

    const pitch = new Pitch(field.x, field.y, field.width, field.height);
    const goalWidth = goalMouthHeight;
    const goalY = field.y + field.height / 2 - goalWidth / 2;
    const goals = [
        new Goal(0, goalY, field.x, goalWidth, ball.radius, 'left'),
        new Goal(field.x + field.width, goalY, field.x, goalWidth, ball.radius, 'right')
    ];
    const { goalPosts, sidelines, endlines } = createBoundaries(
        field,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

    const world = new GameWorld();
    world.register(pitch, { renderable: true });
    world.register(homeTeam, { renderable: true });
    world.register(awayTeam, { renderable: true });
    goals.forEach(goal => world.register(goal, { renderable: true }));
    world.register(ball, { renderable: true });

    const match = {
        field,
        homeTeam,
        awayTeam,
        players,
        ball,
        score: { home: 0, away: 0 },
        attempts: 0,
        lastAttempt: 'Ready to shoot',
        kickController: new KickController(field),
        kickChargeTime: 0,
        kickWasPressed: false,
        goalkeeperPossession: false,
        goalkeeperClearance: false,
        attemptResolved: false,
        isFinished: false,
        statusText: '',
        update(deltaTime, input) {
            shooter.previousPosition = { x: shooter.x, y: shooter.y };
            goalkeeper.previousPosition = { x: goalkeeper.x, y: goalkeeper.y };
            if (this.goalkeeperPossession) {
                const penaltyArea = this.getPenaltyArea();
                const possessionContext = {
                    input,
                    players,
                    ball,
                    field,
                    goalkeeperPossession: true,
                    activeGoalkeeper: goalkeeper,
                    goalkeeperTeam: goalkeeper.team,
                    penaltyArea
                };
                shooter.update(deltaTime, possessionContext);
                goalkeeper.update(deltaTime, possessionContext);

                if (!this.isInsidePenaltyArea(shooter, penaltyArea)) {
                    this.kickController.aim(goalkeeper, GOALKEEPER_CLEARANCE_SPEED);
                    goalkeeper.kickBall(ball);
                    ball.recordKick(goalkeeper);
                    ball.setCanAcquirePossession(true);
                    this.goalkeeperPossession = false;
                    this.goalkeeperClearance = true;
                }
            } else {
                shooter.update(deltaTime, {
                    input,
                    field,
                    energyDrainPerSecond: 40,
                    energyRecoveryPerSecond: 10
                });
                goalkeeper.update(deltaTime, { ball, field });
            }

            if (!this.goalkeeperPossession && shooter.hasBall && input.kick) {
                this.kickChargeTime = this.kickController.chargeHumanKick(
                    shooter,
                    this.kickChargeTime,
                    deltaTime
                );
            } else if (!this.goalkeeperPossession && shooter.hasBall && this.kickWasPressed) {
                this.kickChargeTime = 0;
                ball.setCanAcquirePossession(true);
                shooter.kickBall(ball);
                ball.recordKick(shooter);
            }
            this.kickWasPressed = input.kick;

            ball.update(deltaTime, players.find(player => player.hasBall), field);
            world.updateCollisions();
            this.statusText = this.getStatusText();
        },
        tryAcquirePossession(player) {
            if (!ball.tryAcquirePossession(player, players)) return false;
            this.onPossessionAcquired(player);
            return true;
        },
        onPossessionAcquired(player) {
            if (player.isGoalkeeper) {
                this.goalkeeperPossession = true;
                ball.setCanAcquirePossession(false);
                this.recordAttempt('Saved');
            }
        },
        scoreGoal(goal) {
            if (goal.goalSide === 'right') {
                this.score.home++;
                this.finishAttempt('Goal!');
            } else {
                this.finishAttempt('Missed');
            }
        },
        startSidelineKick() {
            this.finishAttempt('Missed');
        },
        startEndlineRestart() {
            if (this.goalkeeperClearance) {
                this.resetAttempt();
            } else {
                this.finishAttempt('Missed');
            }
        },
        recordAttempt(result) {
            if (this.attemptResolved) return;
            this.attempts++;
            this.attemptResolved = true;
            this.lastAttempt = result;
            this.statusText = this.getStatusText();
        },
        finishAttempt(result) {
            this.recordAttempt(result);
            this.resetAttempt();
        },
        resetAttempt() {
            shooter.resetPosition();
            shooter.energy = 100;
            shooter.hasBall = true;
            shooter.kickSpeed = 0;
            shooter.isChargingKick = false;
            shooter.kickChargeProgress = 0;
            goalkeeper.resetPosition();
            goalkeeper.hasBall = false;
            this.kickChargeTime = 0;
            this.kickWasPressed = false;
            this.goalkeeperPossession = false;
            this.goalkeeperClearance = false;
            this.attemptResolved = false;
            ball.velocity = { x: 0, y: 0 };
            ball.setPossession(shooter, players);
            ball.setCanAcquirePossession(false);
            this.statusText = this.getStatusText();
        },
        getPenaltyArea() {
            const depth = field.width * 16.5 / 105;
            const height = field.height * 40.3 / 68;
            const centerY = field.y + field.height / 2;
            return {
                side: goalkeeper.goalSide,
                minX: field.x + field.width - depth,
                maxX: field.x + field.width,
                minY: centerY - height / 2,
                maxY: centerY + height / 2
            };
        },
        isInsidePenaltyArea(player, penaltyArea) {
            return player.x >= penaltyArea.minX &&
                player.x <= penaltyArea.maxX &&
                player.y >= penaltyArea.minY &&
                player.y <= penaltyArea.maxY;
        },
        setPossession(player) {
            if (player !== shooter) return;
            ball.setPossession(shooter, players);
        },
        getStatusText() {
            const charge = Math.round(
                this.kickChargeTime / KICK_CHARGE_DURATION * 100
            );
            return `Shootout practice - Goals: ${this.score.home}/${this.attempts} - ${this.lastAttempt} - Arrows: move/turn, S: sprint, hold/release Space to shoot (${charge}%)`;
        }
    };

    const playerBallCollisionHandler = new PlayerBallCollisionHandler(
        players,
        player => match.onPossessionAcquired(player)
    );
    const collisionHandler = new FootballCollisionHandler(match);
    const collisionEntities = [
        ...players,
        ball,
        ...goalPosts,
        ...sidelines,
        ...goals,
        ...endlines
    ];
    collisionEntities.forEach(entity => world.registerCollider(entity));
    world.collisionSystem.addCollisionListener((entityA, entityB) => {
        playerBallCollisionHandler.handle(entityA, entityB);
        collisionHandler.handle(entityA, entityB);
    });
    match.statusText = match.getStatusText();

    return {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        field,
        match,
        players,
        renderables: world.renderables,
        getDraggablePlayer(position) {
            return Math.hypot(shooter.x - position.x, shooter.y - position.y) <=
                shooter.radius + 4 ? shooter : null;
        },
        movePlayer(player, position) {
            if (player !== shooter) return;
            shooter.x = Math.max(field.x + shooter.radius, Math.min(
                field.x + field.width - shooter.radius,
                position.x
            ));
            shooter.y = Math.max(field.y + shooter.radius, Math.min(
                field.y + field.height - shooter.radius,
                position.y
            ));
            shooter.previousPosition = { x: shooter.x, y: shooter.y };
        },
        selectPlayer: player => match.setPossession(player)
    };
}
