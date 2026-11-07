import assert from 'assert';
import KickController, {
    KICK_CHARGE_DURATION
} from '../scripts/football/match/KickController.js';

const field = { x: 0, y: 0, width: 1000, height: 600 };

function test(name, run) {
    run();
    console.log(`ok - ${name}`);
}

test('human kick charging scales from minimum to maximum and caps at full charge', () => {
    const controller = new KickController(field);
    const player = { kickSpeed: 0 };

    assert.equal(controller.chargeHumanKick(player, 0, 0), 0);
    assert.equal(player.kickSpeed, 220);

    const halfCharge = controller.chargeHumanKick(player, 0, KICK_CHARGE_DURATION / 2);
    assert.equal(halfCharge, KICK_CHARGE_DURATION / 2);
    assert.equal(player.kickSpeed, 460);

    const fullCharge = controller.chargeHumanKick(player, halfCharge, 1);
    assert.equal(fullCharge, KICK_CHARGE_DURATION);
    assert.equal(player.kickSpeed, 700);
});

test('AI kick chance is zero for a zero-duration update', () => {
    const controller = new KickController(field);
    const player = { team: {}, kickSpeed: 0 };
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
        assert.strictEqual(controller.tryKick(player, 0, () => assert.fail('should not kick')), false);
    } finally {
        Math.random = originalRandom;
    }
});

test('AI kick decisions use the configured per-second probability', () => {
    const controller = new KickController(field);
    const player = {
        x: 100,
        y: 300,
        direction: { x: 1, y: 0 },
        team: { attacksRight: true, fieldPlayers: [], goalkeeper: null },
        kickSpeed: 0
    };
    const originalRandom = Math.random;
    let kicks = 0;
    Math.random = () => 0.39;

    try {
        assert.strictEqual(controller.tryKick(player, 1, () => kicks++), true);
    } finally {
        Math.random = originalRandom;
    }

    assert.strictEqual(kicks, 1);
});

test('AI aiming accepts an explicit clearance speed', () => {
    const controller = new KickController(field);
    const team = {
        attacksRight: true,
        fieldPlayers: [],
        goalkeeper: null
    };
    const player = {
        x: 100,
        y: 300,
        direction: { x: 1, y: 0 },
        team,
        kickSpeed: 0
    };
    team.goalkeeper = player;
    const originalRandom = Math.random;
    Math.random = () => 0;

    try {
        controller.aim(player, 450);
    } finally {
        Math.random = originalRandom;
    }

    assert.strictEqual(player.kickSpeed, 450);
    assert.ok(player.direction.x > 0);
});
