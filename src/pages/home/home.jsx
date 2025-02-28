import { useState, useEffect, useRef } from 'react';
import './app.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Button, Dropdown, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { NewPolygonIcon } from '../../util/add.icon';
import { FilterComponent } from './filter';
import FilterResult from '../filter/filter';
import { filterPointsInPolygon, filterPointsWithCircle } from './featcher';
import { CirclePolygon } from '../createPolygon/circle.polygon';
import RangeInput from '../../util/range.input';
import { handleGetCenter } from '../../util/service';
import { editPoligon } from '../../service/poligons.service';
import customFetch from '../../util/fetch';

function App() {
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [open, setOpen] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [polygons, setPolygons] = useState([]);
  const [openedPolygon, setOpenedPolygons] = useState([]);
  const [openedCircle, setOpenedCircle] = useState([]);
  const [openFilter, setOpenFilter] = useState(false);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const [filterType, setFilterType] = useState('polygon');
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(14);
  const navigate = useNavigate();
  const mapRef = useRef();

  const polygonTypes = ['polygon', 'circle'].map((type) => {
    return {
      key: type,
      label: <span style={{ textTransform: 'capitalize' }}>{type}</span>,
      onClick: () => {
        navigate(`/polygon/new/${type}`);
        setOpen(false);
      },
    };
  });

  const fetchPolygons = async () => {
    try {
      const response = await customFetch('/data');
      const jsonResponse = await response.json();
      const {
        data: { data: apiData },
      } = jsonResponse;

      if (!apiData || !apiData.map_place_polygons) {
        throw new Error('Данные по полигонам не найдены');
      }

      const formattedPolygons = Object.entries(apiData.map_place_polygons).map(
        ([id, polygon]) => {
          const positions = polygon.coordinates[0].map((position) => ({
            lat: position[0],
            lng: position[1],
          }));

          return {
            id,
            name: polygon.ru || polygon.en,
            positions,
            center: {
              lat: polygon.json?.lat || polygon.coordinates[0][0][0],
              lng: polygon.json?.lng || polygon.coordinates[0][0][1],
            },
            radius: polygon.json?.radius || 0,
            type: polygon.coordinates[0].length === 1 ? 'circle' : 'polygon',
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          };
        },
      );
      setPolygons(formattedPolygons);
      localStorage.setItem('polygons', JSON.stringify(formattedPolygons));
      console.log(formattedPolygons);
    } catch (error) {
      console.error('Ошибка при получении полигонов:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPolygons();

    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      setUserLocation(JSON.parse(storedLocation));
      setTimeout(() => {
        setLoading(false);
      }, 10);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
          setTimeout(() => {
            setLoading(false);
          }, 10);
        },
        () => {
          setUserLocation([33.58945533558725, -7.626056671142579]);
          setLoading(false);
        },
      );
    } else {
      setUserLocation([33.58945533558725, -7.626056671142579]);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const handleOpenChange = (nextOpen, info) => {
    if (info.source === 'trigger' || nextOpen) {
      setOpen(nextOpen);
      handleGetCenter(mapRef);
    }
  };

  const handleOpenChange1 = (nextOpen, info) => {
    if (info.source === 'trigger' || nextOpen) {
      setOpen1(nextOpen);
      handleGetCenter(mapRef);
    }
  };

  const getPolygons = () => {
    return polygons.map((polygon, index) => {
      return {
        key: index,
        label: polygon.name,
        onClick: () => {
          navigate(`/polygon/${polygon.id}/${polygon?.type || 'polygon'}`);
          setOpen(false);
          localStorage.setItem(
            'userLocation',
            JSON.stringify([polygon?.center?.lat, polygon?.center?.lng]),
          );
        },
      };
    });
  };

  const closeFilter = () => {
    setOpenFilter(!openFilter);
    setPositions([[]]);
    setActivePolygon(0);
    setOpenedPolygons([]);
    setOpenedCircle([]);
    setCenter(null);
    setRadius(0);
    setFilterType('polygon');
    handleGetCenter(mapRef);
  };

  const clearFilter = () => {
    setPositions([[]]);
    setActivePolygon(0);
    setOpenedPolygons([]);
    setOpenedCircle([]);
    setCenter(null);
    setRadius(0);
    handleGetCenter(mapRef);
  };

  const handleSavePolygon = async (polygon) => {
    try {
      if (!polygon || !polygon.positions?.length) {
        return alert('Invalid polygon data');
      }

      const key = polygon.clipPositions ? 'clipPositions' : 'positions';
      const centerKey = polygon.clipCenter ? 'clipCenter' : 'center';
      const { lat: fPlat, lng: fPlng } = polygon[key][0];
      const formattedPolygonPosition = polygon[key]?.map(({ lat, lng }) => [
        lat,
        lng,
      ]);

      const response = await editPoligon(
        polygon.id,
        polygon.name,
        [...formattedPolygonPosition, [fPlat, fPlng]],
        polygon[centerKey],
        polygon.radius,
      );

      console.log(response);
      if (response.status === 'error') {
        return alert('Error saving polygon');
      }
      alert('Polygon saved');
    } catch (error) {
      console.error('Error in handleSavePolygon:', error);
      alert('An error occurred while saving the polygon');
    }
  };

  const result = openFilter
    ? filterType === 'polygon'
      ? filterPointsInPolygon(polygons, positions)
      : filterPointsWithCircle(polygons, center, radius)
    : [];

  const getPolygonPoints = () => {
    let points = [];
    let circle = [];
    if (openedPolygon.length || openedCircle.length) {
      points = [];
      circle = [];
    } else {
      result?.map((polygon) => {
        if (polygon?.type === 'circle') {
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
    !loading && (
      <>
        <MapContainer
          center={userLocation}
          zoom={filterType === 'polygon' ? 14 : zoomLevel}
          minZoom={3}
          style={{ height: '100vh', width: '100%' }}
          doubleClickZoom={false}
          ref={mapRef}
        >
          <Button
            className={`show-polygon-points ${openFilter ? 'open' : ''} ${
              result?.length === 0 && 'disabled'
            }`}
            type="primary"
            onClick={getPolygonPoints}
          >
            Points
          </Button>
          <small className="zoom-value">{zoomLevel}</small>
          <FilterResult
            data={result}
            open={openFilter}
            setOpen={() => closeFilter()}
            setFilterType={setFilterType}
            clearFilter={clearFilter}
          />
          {filterType === 'circle' && (
            <RangeInput
              value={radius}
              setValue={setRadius}
              main={true}
              zoomLevel={zoomLevel}
              center={center}
            />
          )}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {openFilter &&
            (filterType === 'polygon' ? (
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
            ) : (
              <CirclePolygon
                center={center}
                setCenter={setCenter}
                radius={radius}
                setRadius={setRadius}
                setZoomLevel={setZoomLevel}
              />
            ))}
          {openedPolygon?.map((polygonPositions, polygonIndex) => (
            <Polyline
              key={polygonIndex}
              positions={polygonPositions || []}
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
                className: 'custom-point-icon',
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

          <MarkerClusterGroup chunkedLoading>
            {result?.map((polygon, index) => {
              const customIcon = L.divIcon({
                className: 'custom-badge-icon',
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
                    <p style={{ minWidth: '120px' }}>Polygon: {polygon.name}</p>
                    <p className="polygon-color">
                      Color: <span style={{ background: 'balck' }}></span>
                    </p>
                    <details style={{ width: '100%' }}>
                      <div style={{ display: 'flex' }}>
                        <summary>polygon coordinates</summary>
                      </div>
                      {polygon.type !== 'circle' ? (
                        polygon[
                          `${
                            polygon.clipPositions
                              ? 'clipPositions'
                              : 'positions'
                          }`
                        ]?.map((position, positionIndex) => (
                          <div key={positionIndex}>
                            <p style={{ inlineSize: '100%' }}>
                              {positionIndex + 1}:{' '}
                              {`${position?.lat}, ${position?.lng}`}
                            </p>
                          </div>
                        ))
                      ) : (
                        <>
                          <p style={{ inlineSize: '100%' }}>
                            Center coordinates: <br />
                            {`${
                              polygon[
                                `${
                                  polygon.clipCenter ? 'clipCenter' : 'center'
                                }`
                              ]?.lat
                            }, ${
                              polygon[
                                `${
                                  polygon.clipCenter ? 'clipCenter' : 'center'
                                }`
                              ]?.lng
                            }`}
                          </p>
                          <p style={{ inlineSize: '100%' }}>
                            Radius: {polygon.radius}m
                          </p>
                        </>
                      )}
                      coordinates
                    </details>
                    <div
                      style={{ width: '100%', display: 'flex', gap: '30px' }}
                    >
                      <Button
                        type="default"
                        style={{ marginTop: '20px', fontSize: '1.08333em' }}
                        onClick={async () => {
                          try {
                            const clipboardText =
                              await navigator.clipboard.readText();
                            const lines = clipboardText
                              .split('\n')
                              .filter((line) => line.trim() !== '');
                            if (lines.length < 2) {
                              alert(
                                'Буфер обмена не содержит достаточных данных.',
                              );
                              return;
                            }
                            console.log('Current INsert', polygon.name, index);
                            const newName = lines[0];
                            const newPositions = lines
                              .slice(1)
                              .map((line) => {
                                const parts = line.split(' ');
                                if (parts.length < 2) return null;
                                const lngStr = parts[1].replace(',', '.');
                                const latStr = parts[0].replace(',', '.');
                                return {
                                  lat: parseFloat(latStr),
                                  lng: parseFloat(lngStr),
                                };
                              })
                              .filter((item) => item !== null);
                            if (newPositions.length === 0) {
                              alert(
                                'Буфер обмена не содержит корректных координат.',
                              );
                              return;
                            }
                            setPolygons((prevPolygons) => {
                              const newPolygons = [...prevPolygons];
                              newPolygons[index] = {
                                ...newPolygons[index],
                              };
                              return newPolygons;
                            });
                            alert('Данные из буфера обмена успешно вставлены.');
                          } catch (error) {
                            console.error(
                              'Ошибка при чтении буфера обмена:',
                              error,
                            );
                            alert(
                              'Не удалось прочитать данные из буфера обмена.',
                            );
                          }
                        }}
                      >
                        Вставить
                      </Button>

                      <Button
                        type="primary"
                        style={{
                          marginTop: '20px',
                          fontSize: '1.08333em',
                          marginRight: '10px',
                        }}
                        onClick={() => {
                          handleSavePolygon(polygon);
                        }}
                      >
                        Сохранить
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          <Space className="button-group" direction="horizontal">
            <Dropdown
              menu={{ items: getPolygons() }}
              placement="bottomRight"
              trigger={['click']}
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
              trigger={['click']}
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
    )
  );
}

export default App;
