
export default class InputManager {
    constructor() {
        this.keys = {};
        this.defendAreaVisible = false;
        window.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyQ'].includes(event.code)) {
                event.preventDefault();
            }
            if (event.code === 'KeyQ' && !this.keys.KeyQ) {
                this.defendAreaVisible = !this.defendAreaVisible;
            }
            this.keys[event.code] = true;
        });
        window.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    isPressed(code) {
        return !!this.keys[code];
    }

    getPlayerInput() {
        return {
            turn: Number(this.isPressed('ArrowRight')) - Number(this.isPressed('ArrowLeft')),
            move: Number(this.isPressed('ArrowUp')) - Number(this.isPressed('ArrowDown')),
            run: this.isPressed('KeyS'),
            kick: this.isPressed('Space'),
            showDefendArea: this.defendAreaVisible
        };
    }
}