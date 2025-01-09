import { useState, useEffect } from "react";
import "./app.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Dropdown, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { NewPolygonIcon } from "../../util/add.icon";
import FilterResult from "../filter/filter";
import { p_colors } from "../../mocks/colors";

function App() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [polygons, setPolygons] = useState([]);
  const [openedPolygon, setOpenedPolygons] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const navigate = useNavigate();

  const fetchPolygons = () => {
    const polygons = JSON.parse(localStorage.getItem("polygons")) || [];
    setPolygons(polygons);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(false);
    } else {
      setLoading(false);
    }
    fetchPolygons();
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const handleOpenChange = (nextOpen, info) => {
    if (info.source === "trigger" || nextOpen) {
      setOpen(nextOpen);
    }
  };

  const getPolygons = () => {
    return polygons.map((polygon, index) => {
      return {
        key: index,
        label: polygon.name,
        onClick: () => {
          navigate(`/polygon/${index}`);
          setOpen(false);
        },
      };
    });
  };

  const isCloseTo = (point1, point2, threshold = 0.001) => {
    const latDiff = Math.abs(point1.lat - point2.lat);
    const lngDiff = Math.abs(point1.lng - point2.lng);
    return latDiff < threshold && lngDiff < threshold;
  };

  const isPointInPolygon = (point, polygon) => {
    const x = point[0],
      y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat,
        yi = polygon[i].lng;
      const xj = polygon[j].lat,
        yj = polygon[j].lng;

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
    return firstPoint.lat === lastPoint.lat && firstPoint.lng === lastPoint.lng;
  };

  const filterPointsInPolygon = (dataPoints) => {
    if (!positions || positions.length === 0) return [];

    return dataPoints.filter((point) => {
      if (!point?.positions) return false;
      try {1
        return positions.some((polygon) => {
          if (!isClosed(polygon)) return false;
          return point?.positions?.some((position) => {
            return isPointInPolygon([position.lat, position.lng], polygon);
          });
        });
      } catch (error) {
        console.log("Error parsing position:", error.message || error);
        return false; // Hata durumunda noktayı dahil etme
      }
    });
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

  const closeFilter = () => {
    setOpenFilter(!openFilter);
    setPositions([[]]);
    setActivePolygon(0);
  setOpenedPolygons([]);
  };

  const result = openFilter ? filterPointsInPolygon(polygons) : [];
  return (
    <>
      <MapContainer
        center={[33.58945533558725, -7.626056671142579]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
        doubleClickZoom={false}
      >
        <FilterResult
          data={[]}
          open={openFilter}
          setOpen={() => closeFilter()}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {openFilter && (
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
                  eventHandlers={{
                    dragend: (e) => {
                      const newLatLng = e.target.getLatLng();
                      setPositions((prevPositions) => {
                        const updatedPositions = [...prevPositions];
                        const activePositions = [
                          ...updatedPositions[polygonIndex],
                        ];
                        activePositions[index] = newLatLng;
                        if (index === 0 && activePositions.length > 1) {
                          activePositions[activePositions.length - 1] =
                            newLatLng;
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
                        const activePositions = [
                          ...updatedPositions[polygonIndex],
                        ];
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
        )}
        {openedPolygon?.map((polygon, polygonIndex) => (
          <Polyline
            key={polygonIndex}
            positions={polygon || []}
            color={polygons?.[polygonIndex]?.color}
          />
        ))}

        {openedPolygon?.map((item, polygonIndex) => {
          return item?.map((position, index) => {
            const m_icon = L.divIcon({
              className: "custom-point-icon",
              html: `<span style="background: ${polygons?.[polygonIndex]?.color}; width: 11px; height: 11px; border-radius: 50%; display: inline-block;"></span>`,
              iconAnchor: [5, 8],
            });
            return (
              <Marker
                key={`${polygonIndex}-marker-${index}`}
                position={position || []}
                icon={m_icon}
              />
            );
          });
        })}

        {result?.map((polygon, index) => {
          const customIcon = L.divIcon({
            className: "custom-badge-icon",
            html: `
      <div style="text-align: center;">
        <div style="border-radius: 15px; padding: 0px 8px;">
          ${polygon.name}
        </div>
        <img src="https://cdn-icons-png.flaticon.com/512/12727/12727781.png" alt="icon" style="width: 34px; height: 34px;" />
      </div>
    `,
          });

          return (
            <Marker
              key={`polygon-${index}`}
              position={polygon?.center || null}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  setOpenedPolygons((prev) => {
                    const newOpenedPolygons = [...prev];
                    if (newOpenedPolygons[index]?.length > 0) {
                      newOpenedPolygons[index] = [];
                    } else {
                      newOpenedPolygons[index] = polygon?.positions || [];
                    }
                    return newOpenedPolygons;
                  });
                },
              }}
            >
              <Popup minWidth={110}>
                <p style={{ minWidth: "120px" }}>Polygon: {polygon?.name}</p>
                <p className="polygon-color">
                  Color: <span style={{ background: polygon?.color }}></span>
                </p>
                <details style={{ width: "100%" }}>
                  <summary>polygon coordinates</summary>
                  {polygon?.positions?.map((position, positionIndex) => (
                    <div key={positionIndex}>
                      <p style={{ inlineSize: "100%" }}>
                        {positionIndex + 1}:{" "}
                        {[`${position?.lat}, ${position?.lng}`]}
                      </p>
                    </div>
                  ))}
                </details>
              </Popup>
            </Marker>
          );
        })}

        <Space className="button-group" direction="horizontal">
          <Dropdown
            menu={{ items: getPolygons() }}
            placement="bottomRight"
            trigger={["click"]}
            onOpenChange={handleOpenChange}
            open={open}
          >
            <Button
              className="my_polygons"
              type="default"
              onClick={(e) => e.stopPropagation()}
            >
              Polygons
            </Button>
          </Dropdown>
          <Button
            className="my_polygons"
            type="default"
            onClick={(e) => {
              e.stopPropagation(), navigate("/polygon/new");
            }}
          >
            New Polygon <NewPolygonIcon />
          </Button>
        </Space>
      </MapContainer>
    </>
  );
}

export default App;
