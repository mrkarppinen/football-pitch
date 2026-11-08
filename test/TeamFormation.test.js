import assert from 'assert';
import createGame from '../scripts/scenes/football-match/createFootballMatchScene.js';
import AiController from '../scripts/football/controllers/AiController.js';
import { PlayerStates } from '../scripts/football/controllers/PlayerStates.js';

if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (callback) {
        return Array.prototype.concat.apply([], this.map(callback));
    };
}
if (!Object.hasOwn) {
    Object.hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
}

const { match, field } = createGame();
const { homeTeam, awayTeam, players, ball } = match;
homeTeam.fieldPlayers.forEach(player => {
    player.controller = new AiController(player);
});

for (const team of [homeTeam, awayTeam]) {
    const roleCounts = team.fieldPlayers.reduce((counts, player) => {
        counts[player.role] = (counts[player.role] ?? 0) + 1;
        return counts;
    }, {});
    assert.strictEqual(team.fieldPlayers.length, 6);
    assert.deepStrictEqual(roleCounts, {
        defence: 3,
        midfield: 2,
        attack: 1
    });
    assert.strictEqual(team.players.length, 7);
}

players.forEach(player => {
    player.hasBall = player.team === awayTeam && player.role === 'midfield';
});
const opposingHolder = players.find(player => player.hasBall);
ball.x = field.x + field.width * 0.6;
ball.y = field.y + field.height / 2;
homeTeam.assignPlayerStates({ players, ball, field });

const homeChaser = homeTeam.fieldPlayers.find(player =>
    player.state === PlayerStates.CHASING_BALL
);
assert.strictEqual(homeChaser.role, 'midfield');

players.forEach(player => {
    player.hasBall = player === opposingHolder;
});
ball.x = field.x + field.width * 0.1;
homeTeam.assignPlayerStates({ players, ball, field });
const defenderChaser = homeTeam.fieldPlayers.find(player =>
    player.state === PlayerStates.CHASING_BALL
);
assert.strictEqual(defenderChaser.role, 'defence');

players.forEach(player => {
    player.hasBall = player.team === homeTeam && player.role === 'midfield';
});
ball.x = field.x + field.width * 0.45;
homeTeam.assignPlayerStates({ players, ball, field });
const attackerSupport = homeTeam.fieldPlayers.find(player =>
    player.role === 'attack'
);
assert.strictEqual(attackerSupport.state, PlayerStates.FORMING_PASSING_LANE);

console.log('ok - six-player teams use role-aware defensive and attacking behavior');
