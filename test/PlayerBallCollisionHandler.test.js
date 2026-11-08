import assert from 'assert';
import PlayerBallCollisionHandler from '../scripts/football/collision/PlayerBallCollisionHandler.js';
import { GameObjectType } from '../scripts/football/entities/GameObjectType.js';

const player = { type: GameObjectType.PLAYER, hasBall: false };
const players = [player];
let possessionCallbackCount = 0;
const ball = {
    type: GameObjectType.BALL,
    tryAcquirePossession(candidate, candidates) {
        assert.strictEqual(candidate, player);
        assert.strictEqual(candidates, players);
        player.hasBall = true;
        return true;
    }
};
const handler = new PlayerBallCollisionHandler(players, () => {
    possessionCallbackCount++;
});

assert.strictEqual(handler.handle(player, ball), true);
assert.strictEqual(player.hasBall, true);
assert.strictEqual(possessionCallbackCount, 1);
assert.strictEqual(
    handler.handle(player, { type: GameObjectType.GOAL }),
    false
);
assert.strictEqual(possessionCallbackCount, 1);

console.log('ok - player-ball collisions acquire possession independently of match rules');
