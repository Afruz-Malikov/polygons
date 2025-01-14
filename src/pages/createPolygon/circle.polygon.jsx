import { Marker, useMapEvents, Circle } from "react-leaflet";
import PropTypes from "prop-types";
import L from "leaflet";

const m_icon = new L.Icon({
  iconUrl:
    "https://www.iconpacks.net/icons/2/free-location-icon-2955-thumb.png",
  iconSize: [40, 41],
  iconAnchor: [21, 38],
  popupAnchor: [1, -34],
});

export const CirclePolygon = ({ setCenter, center, radius = 0, setRadius }) => {
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
        setCenter(newPosition);
      },
      drag(e) {
        const draggedElement = e?.originalEvent?.target;
        if (draggedElement && draggedElement.closest("input")) {
          this.dragging.disable();
        }
        if (draggedElement && draggedElement.closest("div")) {
          this.dragging.enable();
        }
      },
    });
    return null;
  };

  return (
    <>
      <MapClickHandler />
      <Circle center={center || [0, 0]} radius={radius} />

      <Marker
        key={"center"}
        position={center || [0, 0]}
        draggable={true}
        icon={m_icon}
        eventHandlers={{
          dragend: (e) => {
            const newLatLng = e.target.getLatLng();
            setCenter(newLatLng);
          },
          dblclick: () => {
            setCenter(null);
            setRadius(0);
          },
          click: () => {
            setCenter(center);
          },
        }}
      />
    </>
  );
};

CirclePolygon.propTypes = {
  setCenter: PropTypes.func,
  center: PropTypes.object,
  radius: PropTypes.number,
  setRadius: PropTypes.func,
};
