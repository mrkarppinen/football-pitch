import assert from 'assert';
import FootballCollisionHandler from '../scripts/football/match/FootballCollisionHandler.js';
import { GameObjectType } from '../scripts/football/entities/GameObjectType.js';

const calls = [];
const match = {
    tryAcquirePossession: player => calls.push(['possession', player]),
    scoreGoal: goal => calls.push(['goal', goal]),
    startSidelineKick: side => calls.push(['sideline', side]),
    startEndlineRestart: side => calls.push(['endline', side])
};
const handler = new FootballCollisionHandler(match);

function test(name, run) {
    run();
    console.log(`ok - ${name}`);
}

test('ball-player contacts delegate possession to the match', () => {
    const player = { type: GameObjectType.PLAYER };
    const ball = { type: GameObjectType.BALL };

    handler.handle(ball, player);

    assert.deepEqual(calls.pop(), ['possession', player]);
});

test('ball-goal contacts delegate scoring to the match', () => {
    const goal = { type: GameObjectType.GOAL };
    const ball = { type: GameObjectType.BALL };

    handler.handle(goal, ball);

    assert.deepEqual(calls.pop(), ['goal', goal]);
});

test('carrying players trigger the appropriate restart at a boundary', () => {
    const player = { type: GameObjectType.PLAYER, hasBall: true };

    handler.handle(player, { type: GameObjectType.SIDELINE, side: 'top' });
    handler.handle({ type: GameObjectType.ENDLINE, side: 'left' }, player);

    assert.deepEqual(calls.splice(0), [
        ['sideline', 'top'],
        ['endline', 'left']
    ]);
});

test('a free ball triggers a sideline or endline restart', () => {
    const ball = { type: GameObjectType.BALL };

    handler.handle(ball, { type: GameObjectType.SIDELINE, side: 'bottom' });
    handler.handle({ type: GameObjectType.ENDLINE, side: 'right' }, ball);

    assert.deepEqual(calls.splice(0), [
        ['sideline', 'bottom'],
        ['endline', 'right']
    ]);
});
