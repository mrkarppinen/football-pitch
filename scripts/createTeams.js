import AreaDefendingTeam from './AreaDefendingTeam.js';
import AiController from './controllers/AiController.js';
import { TeamModes } from './Team.js';
import AreaPlayer from './gameobjects/AreaPlayer.js';
import Goalkeeper from './gameobjects/Goalkeeper.js';

const TEAM_CONFIGS = [
    {
        name: 'Home',
        playerColor: '#2735F5',
        goalKeeperColor: '#f1d83c',
        attacksRight: true,
        mode: TeamModes.ATTACK,
        goalkeeperId: 7,
        goalkeeperGoalSide: 'left',
        roster: [
            { id: 1, name: 'Player1', x: 20, y: 30, role: 'defence' },
            { id: 3, name: 'Player3', x: 20, y: 70, role: 'defence' },
            { id: 9, name: 'Player9', x: 20, y: 50, role: 'defence' },
            { id: 88, name: 'Karppinen', x: 40, y: 40, role: 'attack', kickoff: true },
            { id: 10, name: 'Player10', x: 35, y: 65, role: 'attack' }
        ]
    },
    {
        name: 'Away',
        playerColor: '#DC9450',
        goalKeeperColor: '#e84b5f',
        attacksRight: false,
        mode: TeamModes.DEFENCE,
        goalkeeperId: 8,
        goalkeeperGoalSide: 'right',
        roster: [
            { id: 4, name: 'Player4', x: 80, y: 50, role: 'defence', kickoff: true },
            { id: 5, name: 'Player5', x: 80, y: 30, role: 'defence' },
            { id: 6, name: 'Player6', x: 80, y: 70, role: 'defence' },
            { id: 11, name: 'Player11', x: 60, y: 35, role: 'attack' },
            { id: 12, name: 'Player12', x: 60, y: 65, role: 'attack' }
        ]
    }
];

export default function createTeams(field) {
    const goalMouthHeight = field.width * 7.32 / 105;
    return TEAM_CONFIGS.map(config => {
        const { roster, goalkeeperId, goalkeeperGoalSide, ...teamOptions } = config;
        const team = new AreaDefendingTeam(teamOptions);
        roster.forEach(playerOptions => {
            team.addPlayer(new AreaPlayer({
                ...playerOptions,
                team,
                x: field.x + playerOptions.x / 100 * field.width,
                y: field.y + playerOptions.y / 100 * field.height,
                direction: { x: team.attacksRight ? 1 : -1, y: 0 }
            }));
        });
        team.addPlayer(new Goalkeeper({
            id: goalkeeperId,
            name: `${team.name} Goalkeeper`,
            team,
            goalSide: goalkeeperGoalSide,
            field,
            goalMouthHeight
        }));
        team.players.forEach(player => {
            player.controller = new AiController(player);
        });
        return team;
    });
}
