import Player from './Player.js';
import HumanController from '../controllers/HumanController.js';

const GOALKEEPER_SPEED = 60;

export default class Goalkeeper extends Player {
    constructor({ id, name, team, goalSide, field, goalMouthHeight }) {
        const goalLineX = goalSide === 'left' ? field.x : field.x + field.width;
        const centerY = field.y + field.height / 2;
        super({
            id,
            name,
            team,
            role: 'goalkeeper',
            x: goalSide === 'left' ? goalLineX + 24 : goalLineX - 24,
            y: centerY,
            direction: { x: goalSide === 'left' ? 1 : -1, y: 0 },
            speed: GOALKEEPER_SPEED,
            radius: 10
        });
        this.isGoalkeeper = true;
        this.goalSide = goalSide;
        this.goalLineX = goalLineX;
        this.goalMouthMinY = centerY - goalMouthHeight / 2 + this.radius;
        this.goalMouthMaxY = centerY + goalMouthHeight / 2 - this.radius;
    }

    update(deltaTime, context) {
        if (context.goalkeeperPossession) {
            if (
                this === context.activeGoalkeeper &&
                this.controller instanceof HumanController
            ) {
                this.previousPosition = { x: this.x, y: this.y };
                super.update(deltaTime, { ...context, goalkeeperPossession: false });
            }
            return;
        }
        if (this.controller instanceof HumanController) {
            this.previousPosition = { x: this.x, y: this.y };
            super.update(deltaTime, context);
            return;
        }

        this.x = this.goalLineX + (this.goalSide === 'left' ? 24 : -24);
        this.previousPosition = { x: this.x, y: this.y };
        this.direction = { x: this.goalSide === 'left' ? 1 : -1, y: 0 };

        const targetY = Math.max(
            this.goalMouthMinY,
            Math.min(this.goalMouthMaxY, context.ball.y)
        );
        const differenceY = targetY - this.y;
        this.y += Math.sign(differenceY) * Math.min(
            Math.abs(differenceY),
            GOALKEEPER_SPEED * deltaTime
        );
    }
}
