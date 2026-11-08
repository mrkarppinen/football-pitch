import assert from 'assert';
import createBallPossession from '../scripts/scenes/ball-possession/createBallPossession.js';

const scene = createBallPossession();
const [humanPlayer, awayPlayer] = scene.players;
const { match } = scene;
const { ball } = match;

humanPlayer.x = ball.x;
humanPlayer.y = ball.y;
humanPlayer.previousPosition = { x: ball.x, y: ball.y };
match.update(1 / 60, {
    turn: 0,
    move: 0,
    run: false,
    kick: false,
    showDefendArea: false
});
assert.strictEqual(humanPlayer.hasBall, true);
assert.strictEqual(awayPlayer.hasBall, false);

awayPlayer.x += 100;
awayPlayer.previousPosition = { x: awayPlayer.x, y: awayPlayer.y };
match.update(0.5, {
    turn: 0,
    move: 0,
    run: false,
    kick: true,
    showDefendArea: false
});
match.update(0.01, {
    turn: 0,
    move: 0,
    run: false,
    kick: false,
    showDefendArea: false
});
assert(ball.velocity.x > 0);

console.log('ok - collision test scene supports possession and charged kicks');
