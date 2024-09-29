import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./service/query.service";
import FilterResult from "./util/filter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/12727/12727781.png",
  iconSize: [40, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFilter, setOpenFilter] = useState(false);
  const [positions, setPositions] = useState([]);
  const { data = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers("get/all"),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error: ", error);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const isPointInPolygon = (point, polygon) => {
    const latlng = L.latLng(point[0], point[1]);
    const bounds = L.latLngBounds(polygon.map((p) => L.latLng(p?.lat, p?.lng)));
    return bounds.contains(latlng);
  };

  const filterPointsInPolygon = (dataPoints) => {
    const polygon = positions;
    if (positions?.length < 5) {
      return;
    }
    return dataPoints.filter((point) => {
      if (!point?.position) {
        return false;
      }
      try {
        const position = JSON.parse(point.position);
        if (!position || position.length < 2) {
          console.error("Invalid position data:", position);
          return false;
        }
        return isPointInPolygon(position, polygon);
      } catch (error) {
        console.error("Error parsing position:", error);
        return false;
      }
    });
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const newPosition = e.latlng;
        setPositions((prev) => [...prev, newPosition]);
        console.log("Clicked coordinates:", e.latlng); // Koordinatları konsola yazdır
      },
    });
    return null;
  };

  const closeFilter = () => {
    setOpenFilter(!openFilter);
    setPositions([]);
  };

  return (
    <>
      <MapContainer
        center={[33.547119140625, -7.675495147705078]}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
      >
        <FilterResult
          data={openFilter ? filterPointsInPolygon(data?.innerData || []) : []}
          open={openFilter}
          setOpen={() => closeFilter()}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {openFilter && (
          <>
            {" "}
            <MapClickHandler />
            {positions.length > 0 && (
              <Polyline positions={positions} color="blue" />
            )}
            {positions.map((position, index) => (
              <Marker key={index} position={position} />
            ))}
          </>
        )}
        <MarkerClusterGroup chunkedLoading>
          {!isLoading && (
            <>
              {data?.innerData?.map((user) => {
                const position = JSON.parse(user?.position);
                return (
                  <Marker
                    key={user?.id}
                    position={position[0] != null ? position : null}
                    icon={icon}
                  >
                    <Popup>
                      <p>{user?.property_type}</p>
                      <small>district: {user?.district}</small>
                      <br />
                      <small>elevator: {user?.elevator ? "yes" : "no"}</small>
                      <br />
                      <small>room number: {user?.rooms_number}</small>
                      <br />
                      <small>{user?.publish_date}</small>
                      <br />
                      <small>{user?.title}</small>
                      <br />
                      <details>
                        <summary>description</summary>
                        <small>{user?.description}</small>
                      </details>
                      <br />
                      <p>
                        see {user?.property_type} —{" "}
                        <a href={user?.url} target="blank">
                          here
                        </a>
                      </p>
                    </Popup>
                  </Marker>
                );
              })}
            </>
          )}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
}

export default App;
