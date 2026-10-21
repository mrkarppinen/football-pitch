import Endline from './gameobjects/Endline.js';
import GoalPost from './gameobjects/GoalPost.js';
import Sideline from './gameobjects/Sideline.js';

export default function createBoundaries(field, canvasWidth, canvasHeight) {
    const goalHalfHeight = field.width * 7.32 / 105 / 2;
    const centerY = field.y + field.height / 2;
    const goalPosts = [
        new GoalPost(0, centerY - goalHalfHeight),
        new GoalPost(0, centerY + goalHalfHeight),
        new GoalPost(canvasWidth, centerY - goalHalfHeight),
        new GoalPost(canvasWidth, centerY + goalHalfHeight)
    ];
    const sidelines = [
        new Sideline(field.x, 0, field.width, field.y, 'top'),
        new Sideline(
            field.x,
            field.y + field.height,
            field.width,
            canvasHeight - field.y - field.height,
            'bottom'
        )
    ];
    const endlines = [
        new Endline(0, 0, field.x, canvasHeight, 'left'),
        new Endline(
            field.x + field.width,
            0,
            canvasWidth - field.x - field.width,
            canvasHeight,
            'right'
        )
    ];
    return { goalPosts, sidelines, endlines };
}
