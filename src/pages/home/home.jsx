import { useState, useEffect } from "react";
import "./app.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Dropdown, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { NewPolygonIcon } from "../../util/add.icon";
import { FilterComponent } from "./filter";
import FilterResult from "../filter/filter";
import { getCircleBoundaryPoint, isClosed, isPointInPolygon } from "./featcher";

function App() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [polygons, setPolygons] = useState([]);
  const [openedPolygon, setOpenedPolygons] = useState([]);
  const [openedCircle, setOpenedCircle] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const navigate = useNavigate();

  const polygonTypes = ["polygon", "circle"].map((type) => {
    return {
      key: type,
      label: <span style={{ textTransform: "capitalize" }}>{type}</span>,
      onClick: () => {
        navigate(`/polygon/new/${type}`);
        setOpen(false);
      },
    };
  });

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

  const handleOpenChange1 = (nextOpen, info) => {
    if (info.source === "trigger" || nextOpen) {
      setOpen1(nextOpen);
    }
  };

  const getPolygons = () => {
    return polygons.map((polygon, index) => {
      return {
        key: index,
        label: polygon.name,
        onClick: () => {
          navigate(`/polygon/${index}/${polygon?.type || "polygon"}`);
          setOpen(false);
        },
      };
    });
  };

  const filterPointsInPolygon = (dataPoints) => {
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

  const closeFilter = () => {
    setOpenFilter(!openFilter);
    setPositions([[]]);
    setActivePolygon(0);
    setOpenedPolygons([]);
    setOpenedCircle([]);
  };

  const result = openFilter ? filterPointsInPolygon(polygons) : [];
  const getPolygonPoints = () => {
    let points = [];
    let circle = [];
    if (openedPolygon.length || openedCircle.length) {
      points = [];
      circle = [];
    } else {
      result?.map((polygon) => {
        if (polygon?.type === "circle") {
          circle.push(polygon);
        } else {
          points.push(polygon?.positions);
        }
      });
    }
    setOpenedPolygons(points);
    setOpenedCircle(circle);
  };
  return (
    <>
      <MapContainer
        center={[33.58945533558725, -7.626056671142579]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
        doubleClickZoom={false}
      >
        <Button
          className={`show-polygon-points ${openFilter ? "open" : ""} ${
            result?.length === 0 && "disabled"
          }`}
          type="primary"
          onClick={getPolygonPoints}
        >
          Points
        </Button>
        <FilterResult
          data={result}
          open={openFilter}
          setOpen={() => closeFilter()}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {openFilter && (
          <FilterComponent
            positions={positions}
            setActivePolygon={setActivePolygon}
            setPositions={setPositions}
            setOpen={setOpen}
            activePolygon={activePolygon}
            closeFilter={closeFilter}
            openFilter={openFilter}
            result={result}
            setOpenedPolygon={setOpenedPolygons}
            setOpenedCircle={setOpenedCircle}
          />
        )}
        {openedPolygon?.map((polygon, polygonIndex) => (
          <Polyline
            key={polygonIndex}
            positions={polygon || []}
            color={polygons?.[polygonIndex]?.color}
          />
        ))}

        {openedCircle?.map((circle, circleIndex) => (
          <Circle
            key={circleIndex}
            center={circle?.center}
            radius={circle?.radius}
            color={circle?.color}
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
            iconAnchor: [17, 10],
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
            >
              <Popup minWidth={110}>
                <p style={{ minWidth: "120px" }}>Polygon: {polygon?.name}</p>
                <p className="polygon-color">
                  Color: <span style={{ background: polygon?.color }}></span>
                </p>
                <details style={{ width: "100%" }}>
                  <summary>polygon coordinates</summary>
                  {polygon.type !== "circle" ? (
                    polygon?.positions?.map((position, positionIndex) => (
                      <div key={positionIndex}>
                        <p style={{ inlineSize: "100%" }}>
                          {positionIndex + 1}:{" "}
                          {[`${position?.lat}, ${position?.lng}`]}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      <p style={{ inlineSize: "100%" }}>
                        Center coordinates: <br />
                        {[`${polygon.center?.lat}, ${polygon.center?.lng}`]}
                      </p>
                      <p style={{ inlineSize: "100%" }}>
                        Radius: {polygon.radius}m
                      </p>
                    </>
                  )}
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
          <Dropdown
            menu={{ items: polygonTypes }}
            placement="bottomRight"
            trigger={["click"]}
            onOpenChange={handleOpenChange1}
            open={open1}
          >
            <Button
              className="my_polygons"
              type="default"
              onClick={(e) => e.stopPropagation()}
            >
              New Polygon <NewPolygonIcon />
            </Button>
          </Dropdown>
        </Space>
      </MapContainer>
    </>
  );
}

export default App;
