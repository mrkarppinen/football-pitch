export class ChasingBall {
    get name() {
        return 'ChasingBall';
    }

    get targetKey() {
        return 'ball';
    }
}

export class FormingPassingLane {
    get name() {
        return 'FormingPassingLane';
    }

    get targetKey() {
        return 'support';
    }
}

export class MaintainFormationPosition {
    get name() {
        return 'MaintainFormationPosition';
    }

    get targetKey() {
        return 'formation';
    }
}

export class AttackingGoal {
    get name() {
        return 'AttackingGoal';
    }

    get targetKey() {
        return 'goal';
    }
}

export const PlayerStates = {
    CHASING_BALL: new ChasingBall(),
    FORMING_PASSING_LANE: new FormingPassingLane(),
    MAINTAIN_FORMATION_POSITION: new MaintainFormationPosition(),
    ATTACKING_GOAL: new AttackingGoal()
};
