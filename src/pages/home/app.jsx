import { useState, useEffect } from "react";
import "./app.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { p_colors } from "../../mocks/colors";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Dropdown, Space } from "antd";
import { useNavigate } from "react-router-dom";

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
        {[]?.map((polygon, polygonIndex) => (
          <Polyline
            key={polygonIndex}
            positions={polygon}
            color={p_colors[polygonIndex]}
          />
        ))}
        {[]?.map((item) => {
          return item?.map((position, index) => (
            <Marker key={index} position={position} draggable={true} />
          ));
        })}
        {[]?.map((user) => {
          const position = JSON.parse(user?.position);
          return (
            <Marker
              key={user?.id}
              position={position[0] != null ? position : null}
              icon={icon}
            >
              <Popup>
                <p>polygon</p>
                <br />
                <details>
                  <summary>description</summary>
                  <small>{778}</small>
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
        </Space>
      </MapContainer>
    </>
  );
}

export default App;
