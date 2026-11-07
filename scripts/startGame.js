import BrowserGameHost from './platform/browser/BrowserGameHost.js';

export default function startGame(createScene) {
    return new BrowserGameHost(createScene).start();
}
