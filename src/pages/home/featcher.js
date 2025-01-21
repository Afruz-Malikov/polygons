const toRad = (deg) => deg * (Math.PI / 180);

const getCircleBoundaryPoint = (lat, lng, radius, angle) => {
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

const isPointInPolygon = (point, polygon) => {
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



const isClosed = (polygon) => {
    if (!polygon || polygon.length < 4) return false;
    const firstPoint = polygon[0];
    const lastPoint = polygon[polygon.length - 1];
    return (
        firstPoint?.lat === lastPoint?.lat && firstPoint?.lng === lastPoint?.lng
    );
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Dünya'nın yarıçapı (metre)
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Mesafeyi metre cinsinden döndürür
};


const isPointInCircle = (point, center, radius) => {
    const distance = calculateDistance(
        point[0],
        point[1],
        center.lat,
        center.lng
    );
    return distance <= radius;
};

export const filterPointsInPolygon = (dataPoints, positions) => {
    if (!positions || positions.length === 0) return [];

    return dataPoints.filter((point) => {
        try {
            return positions.some((polygon) => {
                if (!isClosed(polygon)) return false;

                // Circle tipi noktalar için
                if (point.type === "circle") {
                    const center = [point.center?.lat, point.center?.lng];
                    const radius = point.radius; // Circle'ın yarıçapı (metre)

                    // Merkezi kontrol et: Çemberin merkezi poligon içinde mi?
                    if (isPointInPolygon(center, polygon)) return true;

                    // Circle sınırındaki noktaları kontrol et
                    const angleStep = 10; // Sınırda 10 derecelik aralıklarla kontrol edelim

                    for (let angle = 0; angle < 360; angle += angleStep) {
                        const boundaryPoint = getCircleBoundaryPoint(
                            point.center.lat,
                            point.center.lng,
                            radius,
                            angle
                        );

                        // Sınırdaki bir nokta poligon içinde mi?
                        if (
                            isPointInPolygon(
                                [boundaryPoint.lat, boundaryPoint.lng],
                                polygon
                            )
                        ) {
                            return true; // Çemberin bir kısmı poligon içinde
                        }
                    }

                    // Eğer hiçbir sınır noktası poligon içinde değilse, false dönebiliriz
                    return false;
                }

                // Polygon tipi noktalarda
                const points = [...(point?.positions || []), point?.center];
                return points?.some((position) => {
                    return isPointInPolygon([position?.lat, position?.lng], polygon);
                });
            });
        } catch (error) {
            console.log("Error parsing position:", error.message || error);
            return false;
        }
    });
};

export const filterPointsWithCircle = (dataPoints, filterCenter, filterRadius) => {
    if (!filterCenter || !filterRadius || filterRadius <= 0) return [];

    return dataPoints.filter((point) => {
      try {
        if (point.type === "circle") {
          // Dairesel poligon için kontrol
          const distance = calculateDistance(
            filterCenter.lat,
            filterCenter.lng,
            point.center.lat,
            point.center.lng
          );

          // İki dairesel poligon kesişiyor mu?
          return distance <= filterRadius + point.radius;
        } else if (point.type === "polygon") {
          // Normal poligon için kontrol
          return point.positions.some((vertex) =>
            isPointInCircle(
              [vertex.lat, vertex.lng],
              filterCenter,
              filterRadius
            )
          );
        }
        return false;
      } catch (error) {
        console.log("Error during filtering:", error.message || error);
        return false;
      }
    });
  };
