import CanvasDraw from '../CanvasDraw.js';
import GameObject from './GameObject.js';

export default class Pitch extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, 0, 'PITCH');
        this.width = width;
        this.height = height;
    }

    render(ctx) {
        CanvasDraw.drawPitch(ctx, this);
    }
}
