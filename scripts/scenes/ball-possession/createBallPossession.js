import CollisionSystem from '../../core/collision/CollisionSystem.js';
import Controller from '../../football/controllers/Controller.js';
import HumanController from '../../football/controllers/HumanController.js';
import FootballCollisionHandler from '../../football/match/FootballCollisionHandler.js';
import Team, { TeamModes } from '../../football/teams/Team.js';
import Ball from '../../football/entities/Ball.js';
import Pitch from '../../football/entities/Pitch.js';
import Player from '../../football/entities/Player.js';

const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 680;
const FIELD = {
    x: 25,
    y: 16.19,
    width: 1000,
    height: 647.62,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT
};

export default function createBallPossession() {
    const field = { ...FIELD };
    const homeTeam = new Team({
        name: 'Home',
        playerColor: '#2735F5',
        goalKeeperColor: '#f1d83c',
        attacksRight: true,
        mode: TeamModes.ATTACK
    });
    const awayTeam = new Team({
        name: 'Away',
        playerColor: '#DC9450',
        goalKeeperColor: '#e84b5f',
        attacksRight: false,
        mode: TeamModes.DEFENCE
    });
    const homePlayer = homeTeam.addPlayer(new Player({
        id: 1,
        name: 'Home Player',
        team: homeTeam,
        x: field.x + field.width * 0.4,
        y: field.y + field.height / 2,
        direction: { x: 1, y: 0 }
    }));
    const awayPlayer = awayTeam.addPlayer(new Player({
        id: 2,
        name: 'Away Player',
        team: awayTeam,
        x: field.x + field.width * 0.6,
        y: field.y + field.height / 2,
        direction: { x: -1, y: 0 }
    }));
    homePlayer.controller = new HumanController(homePlayer);
    awayPlayer.controller = new Controller(awayPlayer);
    awayPlayer.hasBall = true;

    const players = [homePlayer, awayPlayer];
    const teams = [homeTeam, awayTeam];
    const ball = new Ball(
        awayPlayer.x + awayPlayer.direction.x * 12,
        awayPlayer.y + awayPlayer.direction.y * 12
    );
    ball.setCanAcquirePossession(true);
    const pitch = new Pitch(field.x, field.y, field.width, field.height);
    const collisionSystem = new CollisionSystem();
    [...players, ball].forEach(entity => collisionSystem.register(entity));

    const match = {
        field,
        homeTeam,
        awayTeam,
        players,
        ball,
        statusText: 'Ball possession collision test',
        tryAcquirePossession(player) {
            ball.tryAcquirePossession(player, players);
        },
        setPossession(player) {
            //if (player.team === homeTeam) this.tryAcquirePossession(player);
        },
        update(deltaTime, input) {
            const context = {
                input,
                field,
                players,
                ball,
                energyDrainPerSecond: 40,
                energyRecoveryPerSecond: 10
            };
            teams.forEach(team => team.update(deltaTime, context));
            ball.update(deltaTime, players.find(player => player.hasBall), field);
            collisionSystem.update();
        }
    };

    const collisionHandler = new FootballCollisionHandler(match);
    collisionSystem.addCollisionListener((entityA, entityB) =>
        collisionHandler.handle(entityA, entityB)
    );

    return {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        field,
        match,
        players,
        renderables: [pitch, ...teams, ball],
        getDraggablePlayer(position) {
            return players.find(player =>
                player.team === homeTeam &&
                Math.hypot(player.x - position.x, player.y - position.y) <= player.radius + 4
            ) ?? null;
        },
        movePlayer(player, position) {
            player.x = Math.max(field.x + player.radius, Math.min(
                field.x + field.width - player.radius,
                position.x
            ));
            player.y = Math.max(field.y + player.radius, Math.min(
                field.y + field.height - player.radius,
                position.y
            ));
            player.previousPosition = { x: player.x, y: player.y };
        },
        selectPlayer(player) {
            match.setPossession(player);
        }
    };
}
