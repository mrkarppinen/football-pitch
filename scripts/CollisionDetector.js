export default class CollisionDetector {
    checkCollision(entityA, entityB) {
        if (entityA.collisionMaskType === 'circle' && entityB.collisionMaskType === 'circle') {
            return this.checkCircleCircle(entityA, entityB);
        }
        if (entityA.collisionMaskType === 'circle' && entityB.collisionMaskType === 'rect') {
            return this.checkCircleRect(entityA, entityB);
        }
        if (entityA.collisionMaskType === 'rect' && entityB.collisionMaskType === 'circle') {
            return this.checkCircleRect(entityB, entityA);
        }
        return false;
    }

    checkCircleCircle(circleA, circleB) {
        const radius = circleA.radius + circleB.radius;
        const dx = circleA.x - circleB.x;
        const dy = circleA.y - circleB.y;
        if (dx * dx + dy * dy <= radius * radius) return true;

        if (circleA.sweptCollision) return this.checkSweptCircle(circleA, circleB, radius);
        if (circleB.sweptCollision) return this.checkSweptCircle(circleB, circleA, radius);
        return false;
    }

    checkSweptCircle(movingCircle, stationaryCircle, radius) {
        const start = movingCircle.previousPosition;
        const deltaX = movingCircle.x - start.x;
        const deltaY = movingCircle.y - start.y;
        const lengthSquared = deltaX * deltaX + deltaY * deltaY;
        const projection = lengthSquared
            ? Math.max(
                0,
                Math.min(
                    1,
                    ((stationaryCircle.x - start.x) * deltaX +
                        (stationaryCircle.y - start.y) * deltaY) /
                        lengthSquared
                )
            )
            : 0;
        const closestX = start.x + projection * deltaX;
        const closestY = start.y + projection * deltaY;
        const distanceX = stationaryCircle.x - closestX;
        const distanceY = stationaryCircle.y - closestY;
        return distanceX * distanceX + distanceY * distanceY <= radius * radius;
    }

    checkCircleRect(circle, rectangle) {
        const mask = rectangle.customCollisionMask || rectangle;
        const closestX = Math.max(mask.x, Math.min(circle.x, mask.x + mask.width));
        const closestY = Math.max(mask.y, Math.min(circle.y, mask.y + mask.height));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        if (distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius) {
            return true;
        }

        return circle.sweptCollision && this.segmentIntersectsRect(
            circle.previousPosition.x,
            circle.previousPosition.y,
            circle.x,
            circle.y,
            mask.x - circle.radius,
            mask.y - circle.radius,
            mask.width + circle.radius * 2,
            mask.height + circle.radius * 2
        );
    }

    segmentIntersectsRect(x1, y1, x2, y2, rectX, rectY, rectWidth, rectHeight) {
        const deltaX = x2 - x1;
        const deltaY = y2 - y1;
        let start = 0;
        let end = 1;
        const edges = [
            [-deltaX, x1 - rectX],
            [deltaX, rectX + rectWidth - x1],
            [-deltaY, y1 - rectY],
            [deltaY, rectY + rectHeight - y1]
        ];

        for (const [direction, distance] of edges) {
            if (direction === 0) {
                if (distance < 0) return false;
                continue;
            }

            const intersection = distance / direction;
            if (direction < 0) start = Math.max(start, intersection);
            else end = Math.min(end, intersection);
            if (start > end) return false;
        }

        return true;
    }
}
