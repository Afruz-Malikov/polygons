import { useState, useEffect } from "react";
import "../home/app.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Input, Modal, Space } from "antd";
import { useParams, useNavigate } from "react-router-dom";

export const CreatePolygon = () => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polygonName, setPolygonName] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const showModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const calculatePolygonCentroid = (polygon) => {
    if (!polygon || polygon.length === 0) {
      throw new Error("Polygon points are required.");
    }
    let xSum = 0;
    let ySum = 0;
    polygon.forEach((point) => {
      xSum += point.lat;
      ySum += point.lng;
    });
    const centroid = {
      lat: xSum / polygon.length,
      lng: ySum / polygon.length,
    };
    return centroid;
  };

  const handleOk = (e) => {
    e.stopPropagation();
    if (!polygonName) return alert("Please enter a name for the polygon!");
    const oldPositions = JSON.parse(localStorage.getItem("polygons")) || [];
    let newPositions = [...oldPositions];
    const center = calculatePolygonCentroid(positions[0]);
    if (id != "new") {
      newPositions[id] = {
        ...newPositions[id],
        name: polygonName,
        positions: positions[0],
        center,
      };
    } else {
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      newPositions.push({
        name: polygonName,
        positions: positions[0],
        center,
        color,
      });
    }
    localStorage.setItem("polygons", JSON.stringify(newPositions));
    alert("Polygons saved successfully!");
    setIsModalOpen(false);
    navigate("/");
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const getPolygon = (id) => {
    const polygons = JSON.parse(localStorage.getItem("polygons")) || [];
    console.log("polygons", polygons);

    if (id != "new") {
      const polygon = polygons[id];
      if (polygon) {
        setPositions([polygon.positions]);
        setPolygonName(polygon.name);
        setActivePolygon(1);
      }
    } else {
      setPositions([[]]);
      setPolygonName("");
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(false);
    } else {
      setLoading(false);
    }
    getPolygon(id);
  }, [id]);

  if (loading) {
    return <div>Loading map...</div>;
  }

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

  const savePolygons = (e) => {
    setPolygonName(e.target.value);
  };

  const deletePolygon = () => {
    const polygons = JSON.parse(localStorage.getItem("polygons")) || [];
    if (id != "new") {
      polygons.splice(id, 1);
      localStorage.setItem("polygons", JSON.stringify(polygons));
      alert("Polygon deleted successfully!");
      setIsModalOpen(false);
      navigate("/");
    }
  };

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
    const x = point?.lat;
    const y = point?.lng;
    const x1 = pointA?.lat;
    const y1 = pointA?.lng;
    const x2 = pointB?.lat;
    const y2 = pointB?.lng;
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
        <Polyline positions={positions[0]} color={"blue"} />
        {positions?.map((item, polygonIndex) => {
          return item?.map((position, index) => (
            <Marker
              key={index}
              position={position}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const newLatLng = e.target.getLatLng();
                  console.log("dragend", polygonIndex, index, activePolygon);
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
                  console.log("dbclick", polygonIndex, index, activePolygon);
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
          {id != "new" && (
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
