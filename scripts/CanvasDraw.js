const WHITE = '#f7f8ef';
const CANVAS_WIDTH = 1050;
const CANVAS_HEIGHT = 680;

export default class CanvasDraw {
    static drawPitch(ctx, pitch) {
        const { x, y, width, height } = pitch;
        const midX = x + width / 2;
        const midY = y + height / 2;

        const penaltyDepth = width * 16.5 / 105;
        const penaltyHeight = height * 40.3 / 68;
        const goalAreaDepth = width * 5.5 / 105;
        const goalAreaHeight = height * 18.32 / 68;
        const penaltySpotOffset = width * 11 / 105;
        const centerRadius = width * 9.15 / 105;
        const cornerRadius = width / 105;
        const goalWidth = width * 7.32 / 105;
        const goalDepth = x;

        ctx.fillStyle = '#28651a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const stripeWidth = width / 10;
        for (let i = 0; i < 10; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#388522' : '#31801e';
            ctx.fillRect(x + i * stripeWidth, y, stripeWidth, height);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.035)';
        ctx.fillRect(x, y, width, height);

        this.drawRectangle(ctx, x, y, width, height);
        this.drawLine(ctx, midX, y, midX, y + height);
        this.drawCircle(ctx, midX, midY, centerRadius);
        this.drawCircle(ctx, midX, midY, 4, true);

        this.drawRectangle(
            ctx,
            x,
            midY - penaltyHeight / 2,
            penaltyDepth,
            penaltyHeight
        );
        this.drawRectangle(
            ctx,
            x + width - penaltyDepth,
            midY - penaltyHeight / 2,
            penaltyDepth,
            penaltyHeight
        );

        this.drawRectangle(
            ctx,
            x,
            midY - goalAreaHeight / 2,
            goalAreaDepth,
            goalAreaHeight
        );
        this.drawRectangle(
            ctx,
            x + width - goalAreaDepth,
            midY - goalAreaHeight / 2,
            goalAreaDepth,
            goalAreaHeight
        );

        const leftSpotX = x + penaltySpotOffset;
        const rightSpotX = x + width - penaltySpotOffset;
        this.drawCircle(ctx, leftSpotX, midY, 4, true);
        this.drawCircle(ctx, rightSpotX, midY, 4, true);

        const arcAngle = Math.acos(
            (penaltyDepth - penaltySpotOffset) / centerRadius
        );

        ctx.beginPath();
        ctx.arc(leftSpotX, midY, centerRadius, -arcAngle, arcAngle);
        ctx.lineWidth = 4;
        ctx.strokeStyle = WHITE;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
            rightSpotX,
            midY,
            centerRadius,
            Math.PI - arcAngle,
            Math.PI + arcAngle
        );
        ctx.lineWidth = 4;
        ctx.strokeStyle = WHITE;
        ctx.stroke();

        this.drawCornerArc(ctx, x, y, cornerRadius, 0, Math.PI / 2);
        this.drawCornerArc(
            ctx,
            x + width,
            y,
            cornerRadius,
            Math.PI / 2,
            Math.PI
        );
        this.drawCornerArc(
            ctx,
            x + width,
            y + height,
            cornerRadius,
            Math.PI,
            Math.PI * 1.5
        );
        this.drawCornerArc(
            ctx,
            x,
            y + height,
            cornerRadius,
            Math.PI * 1.5,
            Math.PI * 2
        );

        /*this.drawGoal(ctx, 0, midY - goalWidth / 2, goalDepth, goalWidth);
        this.drawGoal(
            ctx,
            x + width,
            midY - goalWidth / 2,
            goalDepth,
            goalWidth
        );*/
    }

    static drawPlayer(ctx, player) {
        const color = player.isGoalkeeper
            ? player.team.goalKeeperColor
            : player.team.playerColor;
        const directionLength = Math.hypot(player.direction.x, player.direction.y) || 1;

        ctx.strokeStyle = '#39ff14';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
            player.x + (player.direction.x / directionLength) * 12,
            player.y + (player.direction.y / directionLength) * 12
        );
        ctx.stroke();

        this.drawCircle(ctx, player.x, player.y, player.radius, true, 4, color);
        ctx.font = '11px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(190, 190, 190, 0.85)';
        ctx.fillText(
            `${player.name} ${player.id}${player.kickoff ? ' (K)' : player.isGoalkeeper ? ' (GK)' : ''}`,
            player.x,
            player.y - 12
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(player.x - 12, player.y - 17, 24, 3);
        ctx.fillStyle = player.energy > 25 ? '#39ff14' : '#ff4b4b';
        ctx.fillRect(player.x - 12, player.y - 17, 24 * (player.energy / 100), 3);
    }

    static drawBall(ctx, ball) {
        this.drawCircle(ctx, ball.x, ball.y, ball.radius, true, 2, '#fff');
    }

    static drawLine(ctx, x1, y1, x2, y2, width = 4) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.strokeStyle = WHITE;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    static drawCircle(ctx, x, y, radius, fill = false, width = 4, fillStyle = WHITE) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (fill) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        } else {
            ctx.lineWidth = width;
            ctx.strokeStyle = WHITE;
            ctx.stroke();
        }
    }

    static drawRectangle(ctx, x, y, width, height, lineWidth = 4) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = WHITE;
        ctx.strokeRect(x, y, width, height);
    }

    static drawCornerArc(ctx, x, y, radius, start, end) {
        ctx.beginPath();
        ctx.arc(x, y, radius, start, end);
        ctx.lineWidth = 3;
        ctx.strokeStyle = WHITE;
        ctx.stroke();
    }

    static drawGoal(ctx, x, y, width, height) {
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(x, y, width, height);
        this.drawRectangle(ctx, x, y, width, height, 3);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1;

        const spacingX = width / 5;
        const spacingY = height / 8;

        for (let i = 1; i < 5; i++) {
            this.drawNetLine(ctx, x + i * spacingX, y, x + i * spacingX, y + height);
        }

        for (let i = 1; i < 8; i++) {
            this.drawNetLine(ctx, x, y + i * spacingY, x + width, y + i * spacingY);
        }

        ctx.restore();
    }

    static drawNetLine(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
