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

        this.renderGoalEvents(ctx, centerX);

        ctx.font = '20px Arial, sans-serif';
        ctx.fillStyle = '#f7f8ef';
        ctx.fillText(
            'Press SPACE to start a new game',
            centerX,
            this.canvasHeight - 35
        );
    }

    renderGoalEvents(ctx, centerX) {
        const events = this.match.goalEvents;
        const headingY = this.canvasHeight / 2 + 95;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f7f8ef';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText('GOALS', centerX, headingY);

        if (events.length === 0) {
            ctx.font = '16px Arial, sans-serif';
            ctx.fillStyle = '#d5e8cf';
            ctx.fillText('No goals scored', centerX, headingY + 28);
            return;
        }

        const listTop = headingY + 28;
        const listBottom = this.canvasHeight - 70;
        const columns = events.length > 10 ? 2 : 1;
        const rows = Math.ceil(events.length / columns);
        const rowHeight = Math.max(14, Math.min(22, (listBottom - listTop) / rows));
        const columnWidth = this.canvasWidth * 0.44;
        const fontSize = Math.max(11, Math.min(16, rowHeight * 0.75));
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = '#d5e8cf';

        events.forEach((event, index) => {
            const column = Math.floor(index / rows);
            const row = index % rows;
            const x = columns === 1
                ? centerX
                : centerX + (column === 0 ? -columnWidth / 2 : columnWidth / 2);
            const ownGoalLabel = event.ownGoal ? ' (OG)' : '';
            const text = `${event.time}  ${event.scoringTeam}: ${event.scorer}${ownGoalLabel}`;
            ctx.textAlign = columns === 1 ? 'center' : 'left';
            ctx.fillText(text, x, listTop + row * rowHeight, columnWidth - 12);
        });
    }

    getOutcomeText() {
        if (this.match.score.home === this.match.score.away) return 'Draw';
        const winner = this.match.score.home > this.match.score.away
            ? this.match.homeTeam
            : this.match.awayTeam;
        return `${winner.name} wins`;
    }
}
