import { useState, useEffect } from "react";
import "./app.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Dropdown, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { NewPolygonIcon } from "../../util/add.icon";

const icon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/12727/12727781.png",
  iconSize: [40, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function App() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [polygons, setPolygons] = useState([]);
  const [openedPolygon, setOpenedPolygons] = useState([]);
  const [updated, setUpdated] = useState(false);
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

  console.log(openedPolygon, polygons);

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
        {openedPolygon?.map((polygon, polygonIndex) => (
          <Polyline
            key={polygonIndex}
            positions={polygon}
            color={polygons[polygonIndex]?.color}
          />
        ))}

        {openedPolygon?.map((item, polygonIndex) => {
          return item?.map((position, index) => (
            <Marker
              key={`${polygonIndex}-marker-${index}`}
              position={position}
            />
          ));
        })}

        {polygons?.map((polygon, index) => {
          return (
            <Marker
              key={`polygon-${index}`}
              position={polygon?.center || null}
              icon={icon}
              eventHandlers={{
                click: () => {
                  setOpenedPolygons((prev) => {
                    const newOpenedPolygons = [...prev];
                    if (newOpenedPolygons[index]?.length > 0) {
                      newOpenedPolygons[index] = [];
                    } else {
                      newOpenedPolygons[index] = polygon.positions;
                    }
                    return newOpenedPolygons;
                  });
                  setUpdated(!updated);
                },
              }}
            >
              <Popup>
                <p>Polygon: {polygon?.name}</p>
                <p className="polygon-color">
                  Color: <span style={{ background: polygon?.color }}></span>
                </p>
                <details>
                  <summary>polygon coordinates</summary>
                  {polygon?.positions?.map((position, positionIndex) => (
                    <div key={positionIndex}>
                      <small>
                        {positionIndex + 1} -{" "}
                        {[`${position?.lat}, ${position?.lng}`]}
                      </small>
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
