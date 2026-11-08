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
Select **Shootout practice** below the pitch or open
[http://localhost:3000/shootout.html](http://localhost:3000/shootout.html) to practice against a goalkeeper.

## Controls

- Arrow keys: turn and move the controlled home player; left/right rotate the kick-off or restart taker
- S: sprint while moving forward
- Q: show or hide each field player's defensive area
- Space: hold to charge a kick, then release; at kick-off or any restart this starts play
- At full time, the result screen shows the score; press Space to start a new match
- Click a home player to give them the ball; drag home players to reposition them
- Only one home player is keyboard-controlled at a time; control follows possession or the home player (including the goalkeeper) closest to the free ball
- Away players are AI-controlled. AI ball carriers attempt a kick with a 40% chance per second, aiming 45% toward the opposing goal, 40% toward a teammate, or 15% toward their goalkeeper; goalkeepers clear toward a teammate or the opposing goal
- Goalkeepers track shots near their goal; after a Home goalkeeper catch, opponents clear the penalty area before the human can charge and release a kick, while AI goalkeepers clear automatically
- Shootout practice has one human-controlled shooter and an AI goalkeeper using the same `Goalkeeper` behavior and speed as match mode. Goals and saves reset the ball for another attempt.
- When the ball goes out over a sideline, the other team takes a sideline kick from the touchline
- When the ball goes out over an endline, the defending team takes a goal kick if the attackers touched it last; otherwise, the attackers take a corner

## Teams

Each `AreaDefendingTeam` extends `Team` with a defensive-area radius and assigns AI field players to chase the ball, support the play, or maintain a formation position. AI ball carriers attack the opposing goal. Each side has six field players and one goalkeeper: three defenders, two midfielders, and one attacker. Midfielders lead the press and support play; defenders keep their formation unless the ball enters their defensive third.

## Code organization

- `scripts/core/` contains reusable world registration and collision detection/dispatch.
- `scripts/platform/browser/` owns DOM, canvas, resize, keyboard, and pointer handling. The browser host delegates selection and dragging to scene callbacks instead of deciding football rules.
- `scripts/football/` contains football entities, teams, controllers, match/restart state, kick rules, football collision handling, and football rendering.
- `scripts/scenes/` contains scene factories and configuration. `football-match/createFootballMatchScene.js` is the main composition root; it creates the world and football objects, then wires the match-specific collision handler to the generic collision system.
- `scripts/game.js` and `scripts/ballPossession.js` are browser bundle entry points.

`GameWorld` maintains entity, renderable, and collidable registrations. `CollisionDetector` handles shape tests, and `CollisionSystem` finds colliding pairs and notifies listeners. `PlayerBallCollisionHandler` handles possession for any football scene independently of match rules; `FootballCollisionHandler` handles match-specific goals and boundaries. Player-to-player physical responses and ball-to-post reflection remain on the affected entities.

`MatchManager` coordinates match updates, while `KickController` owns human charge progression and AI kick chance/aiming, `MatchRestartManager` owns restart setup, and `MatchStateManager` validates state transitions. Human kick charge is capped at its configured duration. AI kick chance is calculated per update from a per-second probability, so it remains stable across frame rates. Goalkeeper clearance passes its intended speed into `KickController.aim` rather than overwriting the maximum shot speed afterward.

The match clock defaults to 90 seconds and can be changed through `MATCH_DURATION_SECONDS` in `scripts/scenes/football-match/settings.js`, or overridden when creating a scene with `createGame({ matchDurationSeconds })`. When time expires, play stops and `MatchResultScene` renders the score, outcome, and goal events with scorer names and elapsed match times; own goals are marked. Space starts a fresh match with the same configured duration.

AI goalkeeper speed and goal-shot target heights are configured by `AI_GOALKEEPER_SPEED` and `GOAL_MOUTH_AIM_FRACTIONS` in the same settings module. Human kick charge duration is unchanged; while charging, a vertical bar appears behind the player and fills from bottom to top.

Player, goalkeeper, and ball collision radii are smaller than their original defaults to open up more shooting space. Field players use a 7 px radius, goalkeepers 6 px, and the ball 3 px.

The collision-test scene in `scripts/scenes/ball-possession/createBallPossession.js` has one human-controlled Home player and one Away player holding the ball. Move into the ball carrier to take possession, then hold and release Space to kick. Run `npm run build` and open [http://localhost:3000/testCollision.html](http://localhost:3000/testCollision.html) to try it.

Run the kick, goalkeeper, and match timer regression tests with `npm test`.
