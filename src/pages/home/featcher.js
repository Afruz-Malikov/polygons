const toRad = (deg) => deg * (Math.PI / 180);

export const getCircleBoundaryPoint = (lat, lng, radius, angle) => {
    const R = 6371000;
    const angularDistance = radius / R;
    const δ = angularDistance;
    const φ1 = toRad(lat);
    const λ1 = toRad(lng);
    const φ2 = φ1 + δ * Math.cos(angle);
    const λ2 = λ1 + (δ * Math.sin(angle)) / Math.cos(φ1);
    return {
        lat: (φ2 * 180) / Math.PI,
        lng: (λ2 * 180) / Math.PI,
    };
};

export const isPointInPolygon = (point, polygon) => {
    const x = point[0],
        y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i]?.lat,
            yi = polygon[i]?.lng;
        const xj = polygon[j]?.lat,
            yj = polygon[j]?.lng;

        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
};

export const isClosed = (polygon) => {
    if (!polygon || polygon.length < 4) return false;
    const firstPoint = polygon[0];
    const lastPoint = polygon[polygon.length - 1];
    return (
        firstPoint?.lat === lastPoint?.lat && firstPoint?.lng === lastPoint?.lng
    );
};