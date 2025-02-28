import React, { useRef } from 'react';
import { Marker, Polyline, useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import L, { polygon } from 'leaflet';

const m_icon = new L.Icon({
  iconUrl:
    'https://www.iconpacks.net/icons/2/free-location-icon-2955-thumb.png',
  iconSize: [40, 41],
  iconAnchor: [21, 38],
  popupAnchor: [1, -34],
});

export const NormalPolygon = ({
  setPositions,
  setActivePolygon,
  activePolygon,
  positions,
}) => {
  const dragStartRef = useRef(null);
  const draggingRef = useRef(false);

  // Проверка близости двух точек с порогом (по умолчанию 0.001)
  const isCloseTo = (point1, point2, threshold = 0.001) => {
    const latDiff = Math.abs(point1?.lat - point2?.lat);
    const lngDiff = Math.abs(point1?.lng - point2?.lng);
    return latDiff < threshold && lngDiff < threshold;
  };

  // Определение, находится ли точка внутри полигона (алгоритм лучей)
  const isPointInPolygon = (point, polygon) => {
    let x = point.lng,
      y = point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let xi = parseFloat(polygon[i].lng),
        yi = parseFloat(polygon[i].lat);
      let xj = parseFloat(polygon[j].lng),
        yj = parseFloat(polygon[j].lat);

      const intersects = yi > y !== yj > y;
      if (intersects) {
        const xIntersect = xi + ((y - yi) * (xj - xi)) / (yj - yi);
        if (x < xIntersect) inside = !inside;
      }
    }
    return inside;
  };

  // Обработчик кликов для добавления точек в полигон
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const clickedElement = e.originalEvent.target;
        if (
          clickedElement.closest('button') ||
          clickedElement.closest('section')
        ) {
          return;
        }
        if (isPointInPolygon(e.latlng, positions[0])) return;
        const newPosition = e.latlng;
        setPositions((prevPositions) => {
          const updatedPositions = [...prevPositions];
          const currentPolygon = updatedPositions[activePolygon];

          if (
            currentPolygon?.length >= 3 &&
            isCloseTo(newPosition, currentPolygon[0])
          ) {
            updatedPositions[activePolygon] = [
              ...currentPolygon,
              currentPolygon[0],
            ];
            // После закрытия полигона переключаемся на новый (пустой) для дальнейшего рисования
            setActivePolygon(activePolygon + 1);
            updatedPositions.push([]);
            return updatedPositions;
          }

          updatedPositions[activePolygon] = [
            ...(currentPolygon || []),
            newPosition,
          ];
          return updatedPositions;
        });
      },
      drag(e) {
        const draggedElement = e?.originalEvent?.target;
        if (draggedElement && draggedElement.closest('input')) {
          this.dragging.disable();
        }
        if (draggedElement && draggedElement.closest('div')) {
          this.dragging.enable();
        }
      },
    });
    return null;
  };

  // Обработчик для перетаскивания закрытого полигона
  // Обработчик для перетаскивания закрытого полигона, адаптированный для мобильных устройств
  const PolygonDragHandler = () => {
    const map = useMapEvents({
      mousedown: handleStart,
      mousemove: handleMove,
      mouseup: handleEnd,
      // Если потребуется, можно добавить pointer-события для лучшей поддержки современных браузеров:
      pointerdown: handleStart,
      pointermove: handleMove,
      pointerup: handleEnd,
    });

    // Универсальный способ получения координат из события.
    // Обычно в Leaflet e.latlng присутствует, но на случай нестандартных событий можно добавить проверку.
    function getEventLatLng(e) {
      if (e.latlng) return e.latlng;
      if (e.touches && e.touches.length) {
        return map.containerPointToLatLng([
          e.touches[0].clientX,
          e.touches[0].clientY,
        ]);
      }
      return null;
    }

    function handleStart(e) {
      const latlng = getEventLatLng(e);
      if (!latlng) return;
      console.log(e);
      // Определяем, какой полигон будем перетаскивать
      const polygonIndexForDragging =
        activePolygon > 0 ? activePolygon - 1 : activePolygon;
      const polygonPoints = positions[polygonIndexForDragging];

      if (!polygonPoints || polygonPoints.length < 3) return;

      // Проверяем, что полигон закрыт (первая и последняя точки "близки")
      if (
        !isCloseTo(
          polygonPoints[0],
          polygonPoints[polygonPoints.length - 1],
          0.001,
        )
      )
        return;

      // Начинаем перетаскивание, если точка начала события находится внутри полигона
      if (isPointInPolygon(latlng, polygonPoints)) {
        draggingRef.current = true;
        dragStartRef.current = { ...latlng, axis: null };
        map.dragging.disable();
      }
    }

    function handleMove(e) {
      if (draggingRef.current && dragStartRef.current) {
        const latlng = getEventLatLng(e);
        if (!latlng) return;

        const deltaLat = latlng.lat - dragStartRef.current.lat;
        const deltaLng = latlng.lng - dragStartRef.current.lng;

        // Если ось ещё не выбрана, определяем её по первому значимому смещению
        if (dragStartRef.current.axis === null) {
          dragStartRef.current.axis =
            Math.abs(deltaLng) > Math.abs(deltaLat) ? 'x' : 'y';
        }

        const moveAlongX = dragStartRef.current.axis === 'x';
        const moveAlongY = dragStartRef.current.axis === 'y';

        const polygonIndexForDragging =
          activePolygon > 0 ? activePolygon - 1 : activePolygon;

        setPositions((prevPositions) => {
          const updatedPositions = [...prevPositions];
          const updatedPolygon = updatedPositions[polygonIndexForDragging].map(
            (point) => ({
              lat: parseFloat(point.lat) + (moveAlongY ? deltaLat : 0),
              lng: parseFloat(point.lng) + (moveAlongX ? deltaLng : 0),
            }),
          );
          updatedPositions[polygonIndexForDragging] = updatedPolygon;
          return updatedPositions;
        });

        // Обновляем стартовую точку только по выбранной оси, чтобы минимизировать накопление ошибки
        if (moveAlongY) dragStartRef.current.lat = latlng.lat;
        if (moveAlongX) dragStartRef.current.lng = latlng.lng;
      }
    }

    function handleEnd() {
      if (draggingRef.current) {
        draggingRef.current = false;
        dragStartRef.current = null;
        map.dragging.enable();
      }
    }

    return null;
  };

  // Функция добавления точки между существующими (при перетаскивании маркера)
  const addPointToPolygon = (newPoint) => {
    setPositions((prevPositions) => {
      const updatedPositions = [...prevPositions];
      const activePositions = [...updatedPositions[0]];
      let closestSegmentIndex = -1;
      let minDistance = Infinity;
      for (let i = 0; i < activePositions.length - 1; i++) {
        const pointA = activePositions[i];
        const pointB = activePositions[i + 1];
        const distance = distanceToSegment(newPoint, pointA, pointB);
        if (distance < minDistance) {
          minDistance = distance;
          closestSegmentIndex = i;
        }
      }
      if (closestSegmentIndex !== -1) {
        activePositions.splice(closestSegmentIndex + 1, 0, newPoint);
      }
      updatedPositions[0] = activePositions;
      updatedPositions[1] = [];
      return updatedPositions;
    });
  };

  const distanceToSegment = (point, pointA, pointB) => {
    const x = point.lat;
    const y = point.lng;
    const x1 = pointA.lat;
    const y1 = pointA.lng;
    const x2 = pointB.lat;
    const y2 = pointB.lng;
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <>
      <MapClickHandler />
      <PolygonDragHandler />
      {/* Отображаем замкнутый полигон (если он есть) по индексу закрытого полигона */}
      <Polyline
        positions={
          activePolygon > 0
            ? positions[activePolygon - 1]
            : positions[activePolygon]
        }
        color={'blue'}
      />
      {positions?.map((item, polygonIndex) =>
        item?.map((position, index) => (
          <Marker
            key={index}
            position={position}
            draggable={true}
            icon={m_icon}
            eventHandlers={{
              dragend: (e) => {
                const newLatLng = e.target.getLatLng();
                if (polygonIndex === 0) {
                  setPositions((prevPositions) => {
                    const updatedPositions = [...prevPositions];
                    const activePositions = [...updatedPositions[0]];
                    activePositions[index] = newLatLng;
                    if (index === 0 && activePositions.length > 1) {
                      activePositions[activePositions.length - 1] = newLatLng;
                    } else if (
                      index === activePositions.length - 1 &&
                      activePositions.length > 1
                    ) {
                      activePositions[0] = newLatLng;
                    }
                    updatedPositions[0] = activePositions;
                    return updatedPositions;
                  });
                } else {
                  addPointToPolygon(newLatLng);
                }
              },
              dblclick: () => {
                setPositions((prevPositions) => {
                  const updatedPositions = [...prevPositions];
                  const activePositions = [...updatedPositions[polygonIndex]];
                  activePositions.splice(index, 1);
                  if (polygonIndex === 0 && activePositions.length === 0) {
                    updatedPositions[polygonIndex] = [];
                    setActivePolygon(0);
                  } else {
                    updatedPositions[polygonIndex] = activePositions;
                  }
                  return updatedPositions;
                });
              },
              click: () => {
                if (index === 0 && item.length > 2) {
                  setPositions((prevPositions) => {
                    const updatedPositions = [...prevPositions];
                    updatedPositions[polygonIndex] = [
                      ...updatedPositions[polygonIndex],
                      updatedPositions[polygonIndex][0],
                    ];
                    setActivePolygon(polygonIndex + 1);
                    updatedPositions.push([]);
                    return updatedPositions;
                  });
                }
              },
            }}
          />
        )),
      )}
    </>
  );
};

NormalPolygon.propTypes = {
  setPositions: PropTypes.func,
  setActivePolygon: PropTypes.func,
  activePolygon: PropTypes.number,
  positions: PropTypes.array,
};
