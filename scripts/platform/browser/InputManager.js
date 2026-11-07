
export default class InputManager {
    constructor() {
        this.keys = {};
        this.defendAreaVisible = false;
        this.onKeyDown = event => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyQ'].includes(event.code)) {
                event.preventDefault();
            }
            if (event.code === 'KeyQ' && !this.keys.KeyQ) {
                this.defendAreaVisible = !this.defendAreaVisible;
            }
            this.keys[event.code] = true;
        };
        this.onKeyUp = event => {
            this.keys[event.code] = false;
        };
        this.onBlur = () => {
            this.keys = {};
        };
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
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

    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
    }
}