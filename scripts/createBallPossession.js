import CollisionSystem from './CollisionSystem.js';
import Controller from './controllers/Controller.js';
import HumanController from './controllers/HumanController.js';
import Team, { TeamModes } from './Team.js';
import Ball from './gameobjects/Ball.js';
import Pitch from './gameobjects/Pitch.js';
import Player from './gameobjects/Player.js';

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

    [...teams, ...players, ball].forEach(entity => {
        entity.match = match;
    });

    return {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        field,
        match,
        players,
        renderables: [pitch, ...teams, ball]
    };
}
