import GameWorld from './GameWorld.js';
import MatchManager from './MatchManager.js';
import Ball from './gameobjects/Ball.js';
import Goal from './gameobjects/Goal.js';
import Pitch from './gameobjects/Pitch.js';
import createBoundaries from './createBoundaries.js';
import createTeams from './createTeams.js';

const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 680;
const FIELD = Object.freeze({
    x: 25,
    y: 16.19,
    width: 1000,
    height: 647.62
});

export default function createGame() {
    const field = { ...FIELD, canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT };
    const world = new GameWorld();
    const pitch = new Pitch(field.x, field.y, field.width, field.height);
    const teams = createTeams(field);
    const [homeTeam, awayTeam] = teams;
    const players = teams.flatMap(team => team.players);

    const goalWidth = field.width * 7.32 / 105;
    const goalY = field.y + field.height / 2 - goalWidth / 2;
    const goals = [
        new Goal(0, goalY, field.x, goalWidth, 5, 'left'),
        new Goal(field.x + field.width, goalY, field.x, goalWidth, 5, 'right')
    ];
    const ball = new Ball(CANVAS_WIDTH / 2 - 12, CANVAS_HEIGHT / 2);
    const { goalPosts, sidelines, endlines } = createBoundaries(
        field,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    );

    world.register(pitch, { renderable: true });
    goals.forEach(goal => {
        world.register(goal, { renderable: true });
    });
    teams.forEach(team => {
        world.register(team, { renderable: true });
    });
    world.register(ball, { renderable: true });

    const collisionEntities = [
        ...players,
        ball,
        ...goalPosts,
        ...sidelines,
        ...goals,
        ...endlines
    ];
    collisionEntities.forEach(entity => world.registerCollider(entity));

    const match = new MatchManager({
        field,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        homeTeam,
        awayTeam,
        ball,
        updateCollisions: () => world.updateCollisions()
    });
    world.setMatch(match);

    return {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        field,
        match,
        players,
        renderables: world.renderables
    };
}
