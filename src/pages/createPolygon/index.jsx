import { useState, useEffect } from "react";
import "../home/app.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import { p_colors } from "../../mocks/colors";
import "leaflet/dist/leaflet.css";
import { Button, Input, Modal, Space } from "antd";
import { useSearchAppParams } from "../../service/params.service";

export const CreatePolygon = () => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polygonName, setPolygonName] = useState("");
  const { getParams, setParams } = useSearchAppParams();
  const showModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleOk = (e) => {
    e.stopPropagation();
    if (!polygonName) return alert("Please enter a name for the polygon!");
    const oldPositions = JSON.parse(localStorage.getItem("polygons")) || [];
    const editedIndex = JSON.parse(getParams("edit"));
    let newPositions = [...oldPositions];
    if (editedIndex !== null) {
      newPositions[editedIndex] = { name: polygonName, positions };
    } else {
      newPositions.push({ name: polygonName, positions });
    }
    localStorage.setItem("polygons", JSON.stringify(newPositions));
    alert("Polygons saved successfully!");
    setPositions([[]]);
    setActivePolygon(0);
    setPolygonName("");
    setParams({ edit: null });
    setIsModalOpen(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const isCloseTo = (point1, point2, threshold = 0.001) => {
    const latDiff = Math.abs(point1.lat - point2.lat);
    const lngDiff = Math.abs(point1.lng - point2.lng);
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

        const newPosition = e.latlng;
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

  const savePolygons = (e) => {
    setPolygonName(e.target.value);
  };

  const deletePolygon = () => {
    const polygons = JSON.parse(localStorage.getItem("polygons")) || [];
    const editedIndex = getParams("edit");
    if (editedIndex !== null) {
      polygons.splice(editedIndex, 1);
      localStorage.setItem("polygons", JSON.stringify(polygons));
      alert("Polygon deleted successfully!");
      setPositions([[]]);
      setActivePolygon(0);
      setPolygonName("");
      setParams({ edit: null });
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <MapContainer
        center={[33.58945533558725, -7.626056671142579]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
              eventHandlers={{
                dragend: (e) => {
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

        <Space className="button-group" direction="horizontal">
          {JSON.parse(getParams("edit")) !== null && (
            <Button
              type="primary"
              onClick={deletePolygon}
              className="my_polygons"
              danger
            >
              delete
            </Button>
          )}
          {positions.length > 1 && (
            <Button type="default" onClick={showModal} className="save-polygon">
              Save Polygon
            </Button>
          )}
        </Space>
        <Modal
          title="Filter polygon name"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          centered
          style={{ zIndex: 9999 }}
        >
          <Input
            placeholder="input with clear icon"
            allowClear
            onChange={savePolygons}
            value={polygonName}
          />
        </Modal>
      </MapContainer>
    </>
  );
};
