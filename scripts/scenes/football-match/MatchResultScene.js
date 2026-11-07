export default class MatchResultScene {
    constructor(canvasWidth, canvasHeight, match) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.match = match;
    }

    render(ctx) {
        ctx.fillStyle = '#183f12';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#f7f8ef';
        ctx.font = 'bold 52px Arial, sans-serif';
        ctx.fillText('FULL TIME', centerX, centerY - 110);

        ctx.font = 'bold 38px Arial, sans-serif';
        ctx.fillText(
            `${this.match.homeTeam.name}  ${this.match.score.home}  -  ` +
                `${this.match.score.away}  ${this.match.awayTeam.name}`,
            centerX,
            centerY - 25
        );

        ctx.font = '24px Arial, sans-serif';
        ctx.fillStyle = '#d5e8cf';
        ctx.fillText(this.getOutcomeText(), centerX, centerY + 35);

        ctx.font = '20px Arial, sans-serif';
        ctx.fillStyle = '#f7f8ef';
        ctx.fillText('Press SPACE to start a new game', centerX, centerY + 105);
    }

    getOutcomeText() {
        if (this.match.score.home === this.match.score.away) return 'Draw';
        const winner = this.match.score.home > this.match.score.away
            ? this.match.homeTeam
            : this.match.awayTeam;
        return `${winner.name} wins`;
    }
}
