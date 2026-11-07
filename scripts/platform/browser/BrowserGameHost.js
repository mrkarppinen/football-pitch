import InputManager from './InputManager.js';

export default class BrowserGameHost {
    constructor(createScene) {
        this.createScene = createScene;
    }

    start() {
        const canvas = document.getElementById('pitch');
        const ctx = canvas.getContext('2d');
        const statusElement = document.getElementById('match-status');
        const scene = this.createScene();
        const { canvasWidth, canvasHeight, match, renderables } = scene;

        const render = () => {
            renderables.forEach(gameObject => gameObject.render(ctx));
            if (statusElement.textContent !== match.statusText) {
                statusElement.textContent = match.statusText;
            }
        };

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            const devicePixelRatio = window.devicePixelRatio || 1;
            canvas.width = Math.round(rect.width * devicePixelRatio);
            canvas.height = Math.round(rect.height * devicePixelRatio);
            ctx.setTransform(
                canvas.width / canvasWidth,
                0,
                0,
                canvas.height / canvasHeight,
                0,
                0
            );
            render();
        };

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas.parentElement);
        resizeCanvas();

        const input = new InputManager();
        let activePointer = null;
        const getCanvasPosition = event => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (event.clientX - rect.left) / rect.width * canvasWidth,
                y: (event.clientY - rect.top) / rect.height * canvasHeight
            };
        };

        const onPointerDown = event => {
            const position = getCanvasPosition(event);
            activePointer = {
                id: event.pointerId,
                player: scene.getDraggablePlayer?.(position) ?? null,
                startX: position.x,
                startY: position.y,
                dragged: false
            };
            canvas.setPointerCapture(event.pointerId);
        };

        const onPointerMove = event => {
            if (!activePointer || activePointer.id !== event.pointerId ||
                !activePointer.player) return;

            const position = getCanvasPosition(event);
            if (Math.hypot(position.x - activePointer.startX, position.y - activePointer.startY) > 4) {
                activePointer.dragged = true;
            }
            if (activePointer.dragged) {
                scene.movePlayer?.(activePointer.player, position);
                render();
            }
        };

        const onPointerUp = event => {
            if (activePointer?.id === event.pointerId && activePointer.player &&
                !activePointer.dragged) {
                scene.selectPlayer?.(activePointer.player);
                render();
            }
            activePointer = null;
        };

        const onPointerCancel = () => {
            activePointer = null;
        };
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerCancel);

        let previousTime = 0;
        let animationFrameId;
        let stopped = false;
        const gameLoop = timestamp => {
            if (stopped) return;
            const deltaTime = Math.min((timestamp - (previousTime || timestamp)) / 1000, 0.05);
            previousTime = timestamp;
            match.update(deltaTime, input.getPlayerInput());
            render();
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => {
            stopped = true;
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            input.dispose();
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerCancel);
        };
    }
}
