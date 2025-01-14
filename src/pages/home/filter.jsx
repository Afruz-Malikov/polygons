import { Marker, Polyline, useMapEvents } from "react-leaflet";
import { p_colors } from "../../mocks/colors";
import PropTypes from "prop-types";
import L from "leaflet";

const m_icon = new L.Icon({
  iconUrl:
    "https://www.iconpacks.net/icons/2/free-location-icon-2955-thumb.png",
  iconSize: [40, 41],
  iconAnchor: [20, 39],
  popupAnchor: [1, -34],
});

export const FilterComponent = ({
  positions,
  setActivePolygon,
  setPositions,
  activePolygon,
  setOpenedPolygon,
  setOpenedCircle,
}) => {
  const isCloseTo = (point1, point2, threshold = 0.001) => {
    const latDiff = Math.abs(point1?.lat - point2?.lat);
    const lngDiff = Math.abs(point1?.lng - point2?.lng);
    return latDiff < threshold && lngDiff < threshold;
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const clickedElement = e.originalEvent.target;
        if (
          clickedElement.closest("button") ||
          clickedElement.closest("section")
        ) {
          return;
        }

        const newPosition = e?.latlng;
        setPositions((prevPositions) => {
          const updatedPositions = [...prevPositions];
          const activePositions = updatedPositions[activePolygon];

          if (
            activePositions?.length >= 3 &&
            isCloseTo(newPosition, activePositions?.[0])
          ) {
            updatedPositions[activePolygon] = [
              ...(activePositions || []),
              activePositions?.[0],
            ];
            setActivePolygon(activePolygon + 1);
            updatedPositions.push([]);
            return updatedPositions;
          }

          updatedPositions[activePolygon] = [
            ...(activePositions || []),
            newPosition,
          ];
          return updatedPositions;
        });
      },
    });
    return null;
  };
  return (
    <>
      <MapClickHandler />
      {positions.map((polygon, polygonIndex) => (
        <Polyline
          key={polygonIndex}
          positions={polygon}
          color={p_colors[polygonIndex]}
        />
      ))}
      {positions?.map((item, polygonIndex) => {
        return item?.map((position, index) => (
          <Marker
            key={index}
            position={position}
            draggable={true}
            icon={m_icon}
            eventHandlers={{
              dragend: (e) => {
                setOpenedCircle([]);
                setOpenedPolygon([]);
                const newLatLng = e.target.getLatLng();
                setPositions((prevPositions) => {
                  const updatedPositions = [...prevPositions];
                  const activePositions = [...updatedPositions[polygonIndex]];
                  activePositions[index] = newLatLng;
                  if (index === 0 && activePositions.length > 1) {
                    activePositions[activePositions.length - 1] = newLatLng;
                  } else if (
                    index === activePositions.length - 1 &&
                    activePositions.length > 1
                  ) {
                    activePositions[0] = newLatLng;
                  }
                  updatedPositions[polygonIndex] = activePositions;
                  return updatedPositions;
                });
              },
              dblclick: () => {
                setPositions((prevPositions) => {
                  const updatedPositions = [...prevPositions];
                  const activePositions = [...updatedPositions[polygonIndex]];
                  activePositions.splice(index, 1);
                  if (activePositions.length === 0) {
                    updatedPositions.splice(polygonIndex, 1);
                  } else {
                    updatedPositions[polygonIndex] = activePositions;
                  }
                  return updatedPositions;
                });
              },
              click: () => {
                if (index === 0 && item.length > 3) {
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
        ));
      })}
    </>
  );
};

FilterComponent.propTypes = {
  positions: PropTypes.array,
  setActivePolygon: PropTypes.func,
  setPositions: PropTypes.func,
  setOpen: PropTypes.func,
  activePolygon: PropTypes.number,
  setOpenedPolygon: PropTypes.func,
  setOpenedCircle: PropTypes.func,
};
