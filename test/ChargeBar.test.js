import assert from 'assert';
import CanvasDraw from '../scripts/football/rendering/CanvasDraw.js';
import createGame from '../scripts/scenes/football-match/createFootballMatchScene.js';

if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (callback) {
        return Array.prototype.concat.apply([], this.map(callback));
    };
}
if (!Object.hasOwn) {
    Object.hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
}

function test(name, run) {
    run();
    console.log(`ok - ${name}`);
}

test('human kick charging exposes progress and clears it after release', () => {
    const scene = createGame();
    const player = scene.match.getKickoffPlayer();
    scene.match.kickController.chargeHumanKick(player, 0, 0.25);

    assert.strictEqual(player.isChargingKick, true);
    assert.strictEqual(player.kickChargeProgress, 0.5);

    player.kickBall(scene.match.ball);

    assert.strictEqual(player.isChargingKick, false);
    assert.strictEqual(player.kickChargeProgress, 0);
});

test('charge bar renders on the back of the player and fills upward', () => {
    const fillRects = [];
    const ctx = {
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        arc() {},
        fill() {},
        fillText() {},
        fillRect(...args) {
            fillRects.push(args);
        }
    };
    const player = {
        x: 100,
        y: 100,
        radius: 10,
        direction: { x: 1, y: 0 },
        team: { playerColor: '#00f', goalKeeperColor: '#ff0' },
        name: 'Test',
        id: 1,
        energy: 100,
        isChargingKick: true,
        kickChargeProgress: 0.25
    };

    CanvasDraw.drawPlayer(ctx, player);

    const background = fillRects[fillRects.length - 2];
    const progress = fillRects[fillRects.length - 1];
    assert.deepStrictEqual(background, [82, 88, 4, 24]);
    assert.deepStrictEqual(progress, [82, 106, 4, 6]);
});

test('match scene uses the easier-to-score goalkeeper speed', () => {
    const { match } = createGame();

    assert.strictEqual(match.awayTeam.goalkeeper.speed, 40);
    assert.strictEqual(match.homeTeam.goalkeeper.speed, 40);
});
