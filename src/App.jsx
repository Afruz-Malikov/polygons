import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import { p_colors } from "./mocks/colors";
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
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);

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
    if (!point?.position) return false; 
    try {
      const position = JSON.parse(point.position);
      if (!Array.isArray(position) || position.length !== 2) return false;
      return positions.some((polygon) => {
        if (!isClosed(polygon)) return false;
        const isInside = isPointInPolygon(position, polygon);
        return isInside;
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
  };

  const points = openFilter ? filterPointsInPolygon(data?.innerData || []) : [];
  console.log("points", points, positions);
  return (
    <>
      <MapContainer
        center={[33.58945533558725, -7.626056671142579]}
        zoom={14}
        style={{ height: "100vh", width: "100%" }}
      >
        <FilterResult
          data={points}
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
        <MarkerClusterGroup chunkedLoading>
          {!isLoading && (
            <>
              {points?.map((user) => {
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
