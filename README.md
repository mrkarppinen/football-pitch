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

`Team` is a game object that updates and renders its own roster. Player and ball drawing is centralized in `scripts/CanvasDraw.js`; the collision system still registers individual players so it can resolve contacts between them.

`scripts/createGame.js` is the composition root: team rosters and boundaries come from focused factories, while `GameWorld` keeps entity, renderable, and collidable registrations together. Register new entities with the appropriate `GameWorld.register` flags so they participate in rendering and/or collision handling. `CollisionDetector` handles shape tests; `CollisionSystem` finds collidable pairs and dispatches collision callbacks, while game objects retain their domain-specific collision response.

`MatchManager` coordinates gameplay and delegates human kick charging and AI aim/shot decisions to `KickController`, and kickoff/restart setup to `MatchRestartManager`. `MatchStateManager` remains the authority for valid match-state transitions; its transition table and validation are already a single, cohesive responsibility, so splitting or folding it into `MatchManager` would weaken that boundary. The ball owns pickup permission, grace periods, and possession attachment; match-state changes configure whether it can be acquired, while `MatchManager` applies team/controller effects after a successful pickup. `scripts/game.js` handles browser rendering, input, and the animation loop.

`scripts/createBallPossession.js` provides a minimal collision-test setup with one human-controlled Home player and one Away player holding the ball. Run `npm run build` and open [http://localhost:3000/testCollision.html](http://localhost:3000/testCollision.html) to try the scene; `scripts/ballPossession.js` is its browser entry point.
