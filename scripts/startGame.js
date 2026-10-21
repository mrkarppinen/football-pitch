import InputManager from './InputManager.js';

export default function startGame(createScene) {
    const canvas = document.getElementById('pitch');
    const ctx = canvas.getContext('2d');
    const statusElement = document.getElementById('match-status');
    const { canvasWidth, canvasHeight, field, match, players, renderables } = createScene();

    function render() {
        renderables.forEach(gameObject => gameObject.render(ctx));
        if (statusElement.textContent !== match.statusText) {
            statusElement.textContent = match.statusText;
        }
    }

    function resizeCanvas() {
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
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas.parentElement);
    resizeCanvas();

    const input = new InputManager();
    let activePointer = null;

    function getCanvasPosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / rect.width * canvasWidth,
            y: (event.clientY - rect.top) / rect.height * canvasHeight
        };
    }

    canvas.addEventListener('pointerdown', event => {
        const position = getCanvasPosition(event);
        const player = players.find(candidate =>
            candidate.team === match.homeTeam &&
            Math.hypot(candidate.x - position.x, candidate.y - position.y) <= candidate.radius + 4
        );
        activePointer = {
            id: event.pointerId,
            player,
            startX: position.x,
            startY: position.y,
            dragged: false
        };
        canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', event => {
        if (!activePointer || activePointer.id !== event.pointerId || !activePointer.player) return;
        const position = getCanvasPosition(event);
        if (Math.hypot(position.x - activePointer.startX, position.y - activePointer.startY) > 4) {
            activePointer.dragged = true;
        }
        if (activePointer.dragged) {
            const player = activePointer.player;
            player.x = Math.max(field.x + player.radius, Math.min(
                field.x + field.width - player.radius,
                position.x
            ));
            player.y = Math.max(field.y + player.radius, Math.min(
                field.y + field.height - player.radius,
                position.y
            ));
            player.previousPosition = { x: player.x, y: player.y };
            render();
        }
    });

    canvas.addEventListener('pointerup', event => {
        if (activePointer?.id === event.pointerId && activePointer.player && !activePointer.dragged) {
            match.setPossession(activePointer.player);
            render();
        }
        activePointer = null;
    });

    canvas.addEventListener('pointercancel', () => {
        activePointer = null;
    });

    let previousTime = 0;
    function gameLoop(timestamp) {
        const deltaTime = Math.min((timestamp - (previousTime || timestamp)) / 1000, 0.05);
        previousTime = timestamp;
        match.update(deltaTime, input.getPlayerInput());
        render();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}
