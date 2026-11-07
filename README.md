# football-pitch

## Run the game

Install dependencies and build the browser bundle:

```sh
npm install
npm run build
npm start
```

Then open [http://localhost:3000/game.html](http://localhost:3000/game.html).
`npm start` rebuilds `game.bundle.js` before starting the static server.

## Controls

- Arrow keys: turn and move the controlled home player; left/right rotate the kick-off or restart taker
- S: sprint while moving forward
- Q: show or hide each field player's defensive area
- Space: hold to charge a kick, then release; at kick-off or any restart this starts play
- Click a home player to give them the ball; drag home players to reposition them
- Only one home player is keyboard-controlled at a time; control follows possession or the home player (including the goalkeeper) closest to the free ball
- Away players are AI-controlled. AI ball carriers attempt a kick with a 40% chance per second, aiming 45% toward the opposing goal, 40% toward a teammate, or 15% toward their goalkeeper; goalkeepers clear toward a teammate or the opposing goal
- Goalkeepers track shots near their goal; after a Home goalkeeper catch, opponents clear the penalty area before the human can charge and release a kick, while AI goalkeepers clear automatically
- When the ball goes out over a sideline, the other team takes a sideline kick from the touchline
- When the ball goes out over an endline, the defending team takes a goal kick if the attackers touched it last; otherwise, the attackers take a corner

## Teams

Each `AreaDefendingTeam` extends `Team` with a defensive-area radius and assigns AI field players to chase the ball, support the play, or maintain a formation position. AI ball carriers attack the opposing goal. Each side has five field players and one goalkeeper, with three `defence` roles and two `attack` roles.

## Code organization

- `scripts/core/` contains reusable world registration and collision detection/dispatch.
- `scripts/platform/browser/` owns DOM, canvas, resize, keyboard, and pointer handling. The browser host delegates selection and dragging to scene callbacks instead of deciding football rules.
- `scripts/football/` contains football entities, teams, controllers, match/restart state, kick rules, football collision handling, and football rendering.
- `scripts/scenes/` contains scene factories and configuration. `football-match/createFootballMatchScene.js` is the main composition root; it creates the world and football objects, then wires the match-specific collision handler to the generic collision system.
- `scripts/game.js` and `scripts/ballPossession.js` are browser bundle entry points.

`GameWorld` maintains entity, renderable, and collidable registrations. `CollisionDetector` handles shape tests, and `CollisionSystem` finds colliding pairs and notifies listeners. The football scene wires `FootballCollisionHandler` to translate those generic collision events into match actions; entities no longer hold a back-reference to the match. Player-to-player physical responses and ball-to-post reflection remain on the affected entities.

`MatchManager` coordinates match updates, while `KickController` owns human charge progression and AI kick chance/aiming, `MatchRestartManager` owns restart setup, and `MatchStateManager` validates state transitions. Human kick charge is capped at its configured duration. AI kick chance is calculated per update from a per-second probability, so it remains stable across frame rates. Goalkeeper clearance passes its intended speed into `KickController.aim` rather than overwriting the maximum shot speed afterward.

The collision-test scene in `scripts/scenes/ball-possession/createBallPossession.js` has one human-controlled Home player and one Away player holding the ball. Run `npm run build` and open [http://localhost:3000/testCollision.html](http://localhost:3000/testCollision.html) to try it.

Run the kick and goalkeeper regression tests with `npm test`.
