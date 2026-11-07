import assert from 'assert';
import BrowserGameHost from '../scripts/platform/browser/BrowserGameHost.js';

function test(name, run) {
    run();
    console.log(`ok - ${name}`);
}

test('Space starts a fresh scene after the result screen is shown', () => {
    const originalGlobals = {
        document: global.document,
        window: global.window,
        ResizeObserver: global.ResizeObserver,
        requestAnimationFrame: global.requestAnimationFrame,
        cancelAnimationFrame: global.cancelAnimationFrame
    };

    const windowListeners = {};
    const canvasListeners = {};
    const ctx = { setTransform() {} };
    const statusElement = { textContent: '' };
    const canvas = {
        parentElement: {},
        width: 0,
        height: 0,
        getContext: () => ctx,
        getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 105,
            height: 68
        }),
        addEventListener: (type, listener) => {
            canvasListeners[type] = listener;
        },
        removeEventListener() {},
        setPointerCapture() {}
    };
    let nextFrame;
    let resultRenderCount = 0;
    let restarted = false;
    let freshUpdateCount = 0;

    const finishedScene = {
        canvasWidth: 105,
        canvasHeight: 68,
        match: {
            isFinished: false,
            statusText: 'Playing',
            update() {
                this.isFinished = true;
                this.statusText = 'FULL TIME';
            }
        },
        renderables: [{ render() {} }],
        resultScene: { render() { resultRenderCount++; } },
        restart() {
            restarted = true;
            return freshScene;
        }
    };
    const freshScene = {
        canvasWidth: 105,
        canvasHeight: 68,
        match: {
            isFinished: false,
            statusText: 'New match',
            update() {
                freshUpdateCount++;
            }
        },
        renderables: [{ render() {} }],
        resultScene: { render() {} }
    };

    global.document = {
        getElementById(id) {
            return id === 'pitch' ? canvas : statusElement;
        }
    };
    global.window = {
        devicePixelRatio: 1,
        addEventListener(type, listener) {
            windowListeners[type] = listener;
        },
        removeEventListener() {}
    };
    global.ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
    global.requestAnimationFrame = callback => {
        nextFrame = callback;
        return 1;
    };
    global.cancelAnimationFrame = () => {};

    try {
        const stop = new BrowserGameHost(() => finishedScene).start();
        nextFrame(0);
        assert.strictEqual(resultRenderCount, 1);
        assert.strictEqual(statusElement.textContent, 'FULL TIME');

        windowListeners.keydown({
            code: 'Space',
            preventDefault() {}
        });
        nextFrame(16);

        assert.strictEqual(restarted, true);
        assert.strictEqual(freshUpdateCount, 1);
        assert.strictEqual(statusElement.textContent, 'New match');
        stop();
    } finally {
        global.document = originalGlobals.document;
        global.window = originalGlobals.window;
        global.ResizeObserver = originalGlobals.ResizeObserver;
        global.requestAnimationFrame = originalGlobals.requestAnimationFrame;
        global.cancelAnimationFrame = originalGlobals.cancelAnimationFrame;
    }
});
