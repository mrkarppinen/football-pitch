export const MatchStates = Object.freeze({
    KICK_OFF: 'KICK_OFF',
    MATCH_ON: 'MATCH_ON',
    GOALKEEPER_POSSESSION: 'GOALKEEPER_POSSESSION',
    GOAL_CELEBRATION: 'GOAL_CELEBRATION',
    GOAL_KICK: 'GOAL_KICK',
    SIDELINE_KICK: 'SIDELINE_KICK',
    CORNER_KICK: 'CORNER_KICK',
    FINISHED: 'FINISHED'
});

const MATCH_TRANSITIONS = {
    [MatchStates.KICK_OFF]: [MatchStates.MATCH_ON, MatchStates.FINISHED],
    [MatchStates.MATCH_ON]: [
        MatchStates.GOALKEEPER_POSSESSION,
        MatchStates.GOAL_CELEBRATION,
        MatchStates.GOAL_KICK,
        MatchStates.SIDELINE_KICK,
        MatchStates.CORNER_KICK,
        MatchStates.FINISHED
    ],
    [MatchStates.GOALKEEPER_POSSESSION]: [MatchStates.MATCH_ON, MatchStates.FINISHED],
    [MatchStates.GOAL_CELEBRATION]: [MatchStates.KICK_OFF, MatchStates.FINISHED],
    [MatchStates.GOAL_KICK]: [MatchStates.MATCH_ON, MatchStates.FINISHED],
    [MatchStates.SIDELINE_KICK]: [MatchStates.MATCH_ON, MatchStates.FINISHED],
    [MatchStates.CORNER_KICK]: [MatchStates.MATCH_ON, MatchStates.FINISHED],
    [MatchStates.FINISHED]: []
};

export default class MatchStateManager {
    constructor(initialState) {
        if (!Object.hasOwn(MATCH_TRANSITIONS, initialState)) {
            throw new RangeError(`Unknown match state: ${initialState}`);
        }
        this.currentState = initialState;
    }

    transitionTo(nextState) {
        if (!Object.hasOwn(MATCH_TRANSITIONS, nextState)) {
            throw new RangeError(`Unknown match state: ${nextState}`);
        }
        if (nextState === this.currentState) return;
        if (!MATCH_TRANSITIONS[this.currentState].includes(nextState)) {
            throw new Error(`Invalid match transition: ${this.currentState} -> ${nextState}`);
        }
        this.currentState = nextState;
    }
}
