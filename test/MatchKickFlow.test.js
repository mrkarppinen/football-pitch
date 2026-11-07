import assert from 'assert';
import createGame from '../scripts/scenes/football-match/createFootballMatchScene.js';
import { MatchStates } from '../scripts/football/match/MatchStateManager.js';

if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (callback) {
        return Array.prototype.concat.apply([], this.map(callback));
    };
}
if (!Object.hasOwn) {
    Object.hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
}

const run = () => {
    const { match, players } = createGame();
    const goalkeeper = match.awayTeam.goalkeeper;

    match.changeState(MatchStates.MATCH_ON);
    players.forEach(player => {
        player.hasBall = player === goalkeeper;
    });
    match.startGoalkeeperPossession(goalkeeper);
    match.update(1 / 60, {
        turn: 0,
        move: 0,
        run: false,
        kick: false,
        showDefendArea: false
    });

    assert.strictEqual(goalkeeper.hasBall, false);
    assert.ok(Math.abs(
        Math.hypot(match.ball.velocity.x, match.ball.velocity.y) - 450
    ) < 1e-9);
};

run();
console.log('ok - AI goalkeeper clears at the configured clearance speed');
