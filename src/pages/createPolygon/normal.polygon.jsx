import React, { useEffect, useRef } from 'react';
import { Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';

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
  const rotateStartRef = useRef(null);
  const rotatingRef = useRef(false);
  const rotateCenterRef = useRef(null);

  // Проверка близости двух точек с порогом (по умолчанию 0.001)
  const isCloseTo = (point1, point2, threshold = 0.001) => {
    const latDiff = Math.abs(point1?.lat - point2?.lat);
    const lngDiff = Math.abs(point1?.lng - point2?.lng);
    return latDiff < threshold && lngDiff < threshold;
  };

  // Алгоритм "лучей" для определения, находится ли точка внутри полигона
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

  // Вычисление центра полигона
  const getPolygonCenter = (points) => {
    const latSum = points.reduce((sum, p) => sum + Number(p.lat), 0);
    const lngSum = points.reduce((sum, p) => sum + Number(p.lng), 0);
    return { lat: latSum / points.length, lng: lngSum / points.length };
  };

  // Функция поворота точки вокруг центра
  function rotatePointFixed(point, center, angle) {
    const latR = (Number(point.lat) * Math.PI) / 180;
    const lngR = (Number(point.lng) * Math.PI) / 180;
    const centerLatR = (Number(center.lat) * Math.PI) / 180;
    const centerLngR = (Number(center.lng) * Math.PI) / 180;

    // Переводим координаты в метры
    const x = (lngR - centerLngR) * Math.cos(centerLatR);
    const y = latR - centerLatR;

    // Поворот
    const newX = x * Math.cos(angle) - y * Math.sin(angle);
    const newY = x * Math.sin(angle) + y * Math.cos(angle);

    // Обратно в градусы
    return {
      lat: (newY + centerLatR) * (180 / Math.PI),
      lng: (newX / Math.cos(centerLatR) + centerLngR) * (180 / Math.PI),
    };
  }

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const clickedElement = e.originalEvent.target;
        if (
          clickedElement.closest('button') ||
          clickedElement.closest('section') ||
          isPointInPolygon(e.latlng, positions[0])
        ) {
          return;
        }
        if (!draggingRef.current) {
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
        }
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

  const PolygonDragHandler = () => {
    const map = useMapEvents({
      mousedown(e) {
        if (e.originalEvent.button === 2) return;
        const polygonIndexForDragging =
          activePolygon > 0 ? activePolygon - 1 : activePolygon;
        const polygonPoints = positions[polygonIndexForDragging];

        if (!polygonPoints || polygonPoints.length < 3) return;

        if (
          !isCloseTo(
            polygonPoints[0],
            polygonPoints[polygonPoints.length - 1],
            0.001,
          )
        )
          return;

        if (isPointInPolygon(e.latlng, polygonPoints)) {
          draggingRef.current = true;
          dragStartRef.current = { ...e.latlng };
          map.dragging.disable();
          console.log('mousedown', draggingRef, dragStartRef);
        }
      },

      mousemove(e) {
        if (draggingRef.current && dragStartRef.current) {
          const currentLatLng = e.latlng;
          const deltaLat = currentLatLng.lat - dragStartRef.current.lat;
          const deltaLng = currentLatLng.lng - dragStartRef.current.lng;

          const polygonIndexForDragging =
            activePolygon > 0 ? activePolygon - 1 : activePolygon;

          setPositions((prevPositions) => {
            const updatedPositions = [...prevPositions];
            const updatedPolygon = updatedPositions[
              polygonIndexForDragging
            ].map((point) => ({
              lat: (Number(point.lat) + deltaLat).toString(),
              lng: (Number(point.lng) + deltaLng).toString(),
            }));

            updatedPositions[polygonIndexForDragging] = updatedPolygon;
            return updatedPositions;
          });

          // Обновляем стартовую точку
          dragStartRef.current.lat = currentLatLng.lat;
          dragStartRef.current.lng = currentLatLng.lng;
        }

        if (rotatingRef.current && rotateCenterRef.current) {
          const polygonIndexForRotation =
            activePolygon > 0 ? activePolygon - 1 : activePolygon;
          const center = rotateCenterRef.current;

          const prevAngle = Math.atan2(
            rotateStartRef.current.lat - center.lat,
            rotateStartRef.current.lng - center.lng,
          );
          const newAngle = Math.atan2(
            e.latlng.lat - center.lat,
            e.latlng.lng - center.lng,
          );
          const angleDelta = newAngle - prevAngle;

          setPositions((prevPositions) => {
            const updatedPositions = [...prevPositions];
            updatedPositions[polygonIndexForRotation] = updatedPositions[
              polygonIndexForRotation
            ].map((point) => rotatePointFixed(point, center, angleDelta));
            return updatedPositions;
          });

          rotateStartRef.current = e.latlng;
          console.log('mousemove', draggingRef, dragStartRef);
        }
      },

      mouseup() {
        if (draggingRef.current) {
          draggingRef.current = false;
          dragStartRef.current = null;
          map.dragging.enable();
        }

        if (rotatingRef.current) {
          rotatingRef.current = false;
          rotateStartRef.current = null;
          rotateCenterRef.current = null;
          console.log('mouseup', draggingRef, dragStartRef);
        }
      },

      contextmenu(e) {
        const polygonIndexForRotation =
          activePolygon > 0 ? activePolygon - 1 : activePolygon;
        const polygonPoints = positions[polygonIndexForRotation];

        if (!polygonPoints || polygonPoints.length < 3) return;

        if (!isPointInPolygon(e.latlng, polygonPoints)) return;

        rotatingRef.current = true;
        rotateStartRef.current = e.latlng;
        rotateCenterRef.current = getPolygonCenter(polygonPoints);
        console.log('contextmenu');
      },
    });

    return null;
  };

  // Обработка добавления точки между существующими (при перетаскивании маркера)
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

  // Новый компонент для обработки touch-событий на мобильных устройствах
  const MobileTouchHandler = () => {
    const map = useMap();

    useEffect(() => {
      const container = map.getContainer();

      const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
          // Одно касание – перетаскивание
          const touch = e.touches[0];
          const containerPoint = map.mouseEventToContainerPoint({
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          const latlng = map.containerPointToLatLng(containerPoint);
          const polygonIndex =
            activePolygon > 0 ? activePolygon - 1 : activePolygon;
          const polygonPoints = positions[polygonIndex];
          if (
            polygonPoints &&
            polygonPoints.length >= 3 &&
            isPointInPolygon(latlng, polygonPoints)
          ) {
            draggingRef.current = true;
            dragStartRef.current = { ...latlng, axis: null };
            map.dragging.disable();
          }
        } else if (e.touches.length === 2) {
          // Два касания – вращение только если оба касания внутри полигона
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];

          const containerPoint1 = map.mouseEventToContainerPoint({
            clientX: touch1.clientX,
            clientY: touch1.clientY,
          });
          const containerPoint2 = map.mouseEventToContainerPoint({
            clientX: touch2.clientX,
            clientY: touch2.clientY,
          });
          const latlng1 = map.containerPointToLatLng(containerPoint1);
          const latlng2 = map.containerPointToLatLng(containerPoint2);

          const polygonIndex =
            activePolygon > 0 ? activePolygon - 1 : activePolygon;
          const polygonPoints = positions[polygonIndex];

          if (
            polygonPoints &&
            polygonPoints.length >= 3 &&
            isPointInPolygon(latlng1, polygonPoints) &&
            isPointInPolygon(latlng2, polygonPoints)
          ) {
            rotatingRef.current = true;
            map.touchZoom.disable();

            // Используем координаты второго касания для расчёта угла
            rotateStartRef.current = latlng2;
            rotateCenterRef.current = getPolygonCenter(polygonPoints);
            console.log('Rotation started:', {
              rotateStart: rotateStartRef.current,
              rotateCenter: rotateCenterRef.current,
            });
          }
        }
      };

      const handleTouchMove = (e) => {
        // Обработка перетаскивания
        if (draggingRef.current && e.touches.length === 1) {
          e.preventDefault();
          const touch = e.touches[0];
          const containerPoint = map.mouseEventToContainerPoint({
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          const currentLatLng = map.containerPointToLatLng(containerPoint);
          const deltaLat = currentLatLng.lat - dragStartRef.current.lat;
          const deltaLng = currentLatLng.lng - dragStartRef.current.lng;

          const polygonIndex =
            activePolygon > 0 ? activePolygon - 1 : activePolygon;

          setPositions((prevPositions) => {
            const updatedPositions = [...prevPositions];
            const updatedPolygon = updatedPositions[polygonIndex].map(
              (point) => ({
                lat: (Number(point.lat) + deltaLat).toString(),
                lng: (Number(point.lng) + deltaLng).toString(),
              }),
            );
            updatedPositions[polygonIndex] = updatedPolygon;
            return updatedPositions;
          });

          dragStartRef.current.lat = currentLatLng.lat;
          dragStartRef.current.lng = currentLatLng.lng;
        }

        // Обработка вращения
        if (
          rotatingRef.current &&
          rotateCenterRef.current &&
          e.touches.length === 2
        ) {
          e.preventDefault();
          const touch2 = e.touches[1]; // используем второй палец
          const containerPoint = map.mouseEventToContainerPoint({
            clientX: touch2.clientX,
            clientY: touch2.clientY,
          });
          const currentLatLng = map.containerPointToLatLng(containerPoint);
          const center = rotateCenterRef.current;

          // Вычисляем угол от центра до точки второго касания
          const prevAngle = Math.atan2(
            rotateStartRef.current.lat - center.lat,
            rotateStartRef.current.lng - center.lng,
          );
          const newAngle = Math.atan2(
            currentLatLng.lat - center.lat,
            currentLatLng.lng - center.lng,
          );
          const angleDelta = newAngle - prevAngle;
          const polygonIndex =
            activePolygon > 0 ? activePolygon - 1 : activePolygon;

          setPositions((prevPositions) => {
            const updatedPositions = [...prevPositions];
            updatedPositions[polygonIndex] = updatedPositions[polygonIndex].map(
              (point) => rotatePointFixed(point, center, angleDelta),
            );
            return updatedPositions;
          });
          // Обновляем стартовую точку для следующего расчёта угла
          rotateStartRef.current = currentLatLng;
          console.log('Rotating:', {
            prevAngle,
            newAngle,
            angleDelta,
          });
        }
      };

      const handleTouchEnd = (e) => {
        if (e.touches.length === 0) {
          if (draggingRef.current) {
            draggingRef.current = false;
            dragStartRef.current = null;
            map.dragging.enable();
          }
          if (rotatingRef.current) {
            rotatingRef.current = false;
            rotateStartRef.current = null;
            rotateCenterRef.current = null;
            map.touchZoom.enable();
          }
        } else if (e.touches.length < 2 && rotatingRef.current) {
          // Если остается менее двух касаний – завершаем вращение
          rotatingRef.current = false;
          map.touchZoom.enable();
          rotateStartRef.current = null;
          rotateCenterRef.current = null;
        }
      };

      container.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      container.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      container.addEventListener('touchend', handleTouchEnd, {
        passive: false,
      });
      container.addEventListener('touchcancel', handleTouchEnd, {
        passive: false,
      });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };
    }, [map, activePolygon, positions, setPositions]);

    return null;
  };

  return (
    <>
      <MapClickHandler />
      <PolygonDragHandler />
      <MobileTouchHandler />
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

export default NormalPolygon;
