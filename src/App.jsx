import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./service/query.service";
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
  const { data = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers("get/all"),
  });
  console.log(userLocation);

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
          console.error("Ошибка получения геолокации: ", error);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Загрузка карты...</div>;
  }

  return (
    <MapContainer
      center={[33.547119140625, -7.675495147705078]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

export default App;
