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

function test(name, run) {
    run();
    console.log(`ok - ${name}`);
}

const noInput = {
    turn: 0,
    move: 0,
    run: false,
    kick: false,
    showDefendArea: false
};

test('match timer ends play and remains stopped at full time', () => {
    const { match, resultScene } = createGame({ matchDurationSeconds: 2 });
    match.update(0.75, noInput);

    assert.strictEqual(match.remainingTime, 1.25);
    assert.ok(match.statusText.includes('0:02'));
    assert.strictEqual(match.isFinished, false);

    match.update(1.25, noInput);
    assert.strictEqual(match.remainingTime, 0);
    assert.strictEqual(match.isFinished, true);
    assert.ok(match.statusText.includes('FULL TIME'));

    match.update(10, noInput);
    assert.strictEqual(match.isFinished, true);
    assert.strictEqual(match.remainingTime, 0);
    assert.ok(resultScene);
});

test('finished match presents the score and restart prompt in its own rendered scene', () => {
    const scene = createGame({ matchDurationSeconds: 1 });
    scene.match.score.home = 2;
    scene.match.score.away = 1;
    scene.match.update(1, noInput);

    const renderedText = [];
    scene.resultScene.render({
        fillRect() {},
        fillText(text) {
            renderedText.push(text);
        }
    });

    assert.ok(renderedText.includes('FULL TIME'));
    assert.ok(renderedText.includes('Home  2  -  1  Away'));
    assert.ok(renderedText.includes('Home wins'));
    assert.ok(renderedText.includes('Press SPACE to start a new game'));
});

test('restarting creates a fresh match with the configured duration', () => {
    const scene = createGame({ matchDurationSeconds: 3 });
    scene.match.score.home = 4;
    scene.match.update(3, noInput);

    const restartedScene = scene.restart();

    assert.strictEqual(restartedScene.match.remainingTime, 3);
    assert.deepStrictEqual(restartedScene.match.score, { home: 0, away: 0 });
    assert.strictEqual(restartedScene.match.isFinished, false);
});

test('match duration must be positive and finite', () => {
    assert.throws(() => createGame({ matchDurationSeconds: 0 }), RangeError);
    assert.throws(() => createGame({ matchDurationSeconds: Infinity }), RangeError);
});

test('scoring records the last kicker and elapsed match time', () => {
    const { match } = createGame({ matchDurationSeconds: 90 });
    const scorer = match.homeTeam.fieldPlayers[0];
    match.ball.lastKicker = scorer;
    match.remainingTime = 24.2;
    match.changeState(MatchStates.MATCH_ON);

    match.scoreGoal({ goalSide: 'right' });

    assert.deepStrictEqual(match.goalEvents, [{
        scoringTeam: 'Home',
        scorer: scorer.name,
        scorerTeam: 'Home',
        ownGoal: false,
        timeSeconds: 65,
        time: '1:05'
    }]);
});

test('result scene displays the scorer and goal time', () => {
    const scene = createGame({ matchDurationSeconds: 90 });
    const scorer = scene.match.homeTeam.fieldPlayers[0];
    scene.match.ball.lastKicker = scorer;
    scene.match.remainingTime = 30;
    scene.match.changeState(MatchStates.MATCH_ON);
    scene.match.scoreGoal({ goalSide: 'right' });
    scene.match.finishMatch();

    const renderedText = [];
    scene.resultScene.render({
        fillRect() {},
        fillText(text) {
            renderedText.push(text);
        }
    });

    assert.ok(renderedText.includes(`1:00  Home: ${scorer.name}`));
});

test('own goals are identified in the result event', () => {
    const scene = createGame({ matchDurationSeconds: 90 });
    const scorer = scene.match.awayTeam.fieldPlayers[0];
    scene.match.ball.lastKicker = scorer;
    scene.match.changeState(MatchStates.MATCH_ON);

    scene.match.scoreGoal({ goalSide: 'right' });

    assert.strictEqual(scene.match.goalEvents[0].scoringTeam, 'Home');
    assert.strictEqual(scene.match.goalEvents[0].ownGoal, true);
});
