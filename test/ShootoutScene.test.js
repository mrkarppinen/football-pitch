import assert from 'assert';
import AiController from '../scripts/football/controllers/AiController.js';
import HumanController from '../scripts/football/controllers/HumanController.js';
import Goalkeeper from '../scripts/football/entities/Goalkeeper.js';
import { AI_GOALKEEPER_SPEED } from '../scripts/scenes/football-match/settings.js';
import createShootoutScene from '../scripts/scenes/shootout/createShootoutScene.js';

const neutralInput = {
    turn: 0,
    move: 0,
    run: false,
    kick: false,
    showDefendArea: false
};

const scene = createShootoutScene();
const [shooter, goalkeeper] = scene.players;

assert.strictEqual(scene.players.length, 2);
assert(shooter.controller instanceof HumanController);
assert(goalkeeper instanceof Goalkeeper);
assert(goalkeeper.controller instanceof AiController);
assert.strictEqual(goalkeeper.speed, AI_GOALKEEPER_SPEED);
assert.strictEqual(shooter.radius, 7);
assert.strictEqual(goalkeeper.radius, 6);
assert.strictEqual(scene.match.ball.radius, 3);
assert.strictEqual(
    Math.hypot(scene.match.ball.x - shooter.x, scene.match.ball.y - shooter.y),
    shooter.radius + scene.match.ball.radius
);

const goalkeeperStartY = goalkeeper.y;
shooter.y += 100;
scene.match.ball.setPossession(shooter, scene.players);
scene.match.update(0.5, neutralInput);
assert.strictEqual(goalkeeper.y, goalkeeperStartY + AI_GOALKEEPER_SPEED * 0.5);

scene.match.update(0.5, { ...neutralInput, kick: true });
assert.strictEqual(shooter.isChargingKick, true);
assert(shooter.kickSpeed > 0);
scene.match.update(0.01, neutralInput);
assert(scene.match.ball.velocity.x > 0);

scene.match.scoreGoal({ goalSide: 'right' });
assert.deepStrictEqual(scene.match.score, { home: 1, away: 0 });
assert.strictEqual(scene.match.attempts, 1);
assert.strictEqual(scene.match.lastAttempt, 'Goal!');
assert.strictEqual(shooter.hasBall, true);
assert.strictEqual(scene.match.ball.canAcquirePossession, false);

scene.match.ball.x = goalkeeper.x;
scene.match.ball.y = goalkeeper.y;
scene.match.ball.previousPosition = { x: goalkeeper.x, y: goalkeeper.y };
shooter.hasBall = false;
scene.match.ball.setCanAcquirePossession(true);
scene.match.update(0.016, neutralInput);
assert.strictEqual(goalkeeper.hasBall, true);
assert.strictEqual(scene.match.goalkeeperPossession, true);
assert.strictEqual(scene.match.lastAttempt, 'Saved');
assert.strictEqual(scene.match.attempts, 2);

shooter.y = goalkeeper.y + 120;
for (let frame = 0; frame < 10 && scene.match.goalkeeperPossession; frame++) {
    scene.match.update(0.05, neutralInput);
}
assert.strictEqual(scene.match.goalkeeperPossession, false);
assert.strictEqual(scene.match.goalkeeperClearance, true);
assert(scene.match.ball.velocity.x < 0);
assert.strictEqual(scene.match.attempts, 2);

scene.match.startEndlineRestart('left');
assert.strictEqual(scene.match.goalkeeperClearance, false);
assert.strictEqual(shooter.hasBall, true);
assert.strictEqual(scene.match.attempts, 2);

console.log('ok - shootout scene has one human shooter and game-mode goalkeeper');
