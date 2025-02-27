import { useState, useEffect, useRef } from 'react';
import '../home/app.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Input, Modal, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { NormalPolygon } from './normal.polygon';
import RangeInput from '../../util/range.input';
import { CirclePolygon } from './circle.polygon';
import { handleGetCenter } from '../../util/service';
import { deletePolygon, editPoligon } from '../../service/poligons.service';

export const CreatePolygon = () => {
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([[]]);
  const [activePolygon, setActivePolygon] = useState(0);
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polygonName, setPolygonName] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(14);
  const mapRef = useRef(null);

  const navigate = useNavigate();
  const { id, type } = useParams();
  const showModal = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const calculatePolygonCentroid = (polygon) => {
    if (!polygon || polygon.length === 0) {
      throw new Error('Polygon points are required.');
    }
    let xSum = 0;
    let ySum = 0;
    polygon.forEach((point) => {
      xSum += point?.lat;
      ySum += point?.lng;
    });
    const centroid = {
      lat: xSum / polygon.length,
      lng: ySum / polygon.length,
    };
    return centroid;
  };

  const handleOk = async (e) => {
    try {
      e.stopPropagation();
      if (!polygonName) return alert('Please enter a name for the polygon!');
      const oldPositions = JSON.parse(localStorage.getItem('polygons')) || [];
      let newPositions = [...oldPositions];
      const formattedPolygonPosition = positions[0]?.map(({ lat, lng }) => [
        lat,
        lng,
      ]);
      if (id != 'new') {
        const response = editPoligon(
          id,
          polygonName,
          formattedPolygonPosition,
          center,
          radius,
        );
        if (response.status === 'error') {
          throw new Error('Error saving polygon!');
        }
        newPositions.forEach((polygon) =>
          polygon.id == id
            ? {
                ...polygon,
                name: polygonName,
                positions: positions[0],
                center:
                  type === 'circle'
                    ? center
                    : calculatePolygonCentroid(positions[0]),
                radius,
              }
            : polygon,
        );
      } else {
        const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        const response = await editPoligon(
          undefined,
          polygonName,
          formattedPolygonPosition,
          center,
          radius,
          color,
        );
        console.log(response);
        if (response.status === 'error') {
          throw new Error('Error saving polygon!');
        }
        newPositions.push({
          name: polygonName,
          positions: positions[0],
          center:
            type === 'circle' ? center : calculatePolygonCentroid(positions[0]),
          type: type === 'circle' ? 'circle' : 'polygon',
          radius,
          color,
        });
      }
      localStorage.setItem('polygons', JSON.stringify(newPositions));
      alert('Polygons saved successfully!');
      setIsModalOpen(false);
      handleGetCenter(mapRef);
      navigate('/');
    } catch (error) {
      alert('Error saving polygon!');
      console.log(error);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setIsModalOpen(false);
  };

  const getPolygon = (id) => {
    if (id != 'new') {
      const polygons = JSON.parse(localStorage.getItem('polygons')) || [];
      const polygon = polygons.find((polygon) => polygon.id == id);
      if (polygon) {
        setPolygonName(polygon.name);
        if (type === 'circle') {
          setCenter(polygon.center);
          setRadius(polygon.radius);
        } else {
          setPositions([polygon.positions]);
          setActivePolygon(1);
        }
      }
    } else {
      setPositions([[]]);
      setPolygonName('');
    }
  };

  useEffect(() => {
    setLoading(true);
    setUserLocation(JSON.parse(localStorage.getItem('userLocation')));
    setTimeout(() => {
      setLoading(false);
    }, 10);
    getPolygon(id);
  }, [id]);

  if (loading) {
    return <div>Loading map...</div>;
  }

  const savePolygons = (e) => {
    setPolygonName(e.target.value);
  };

  const handleDeletePolygon = async () => {
    try {
      if (id != 'new') {
        console.log(id);
        const response = await deletePolygon(id);
        if (response.status === 'error') {
          throw new Error('Error deleting polygon!');
        }
        console.log(response);
        const polygons = JSON.parse(localStorage.getItem('polygons')) || [];
        polygons.splice(id, 1);
        localStorage.setItem('polygons', JSON.stringify(polygons));
        alert('Polygon deleted successfully!');
        setIsModalOpen(false);
        navigate('/');
      }
      handleGetCenter(mapRef);
    } catch (error) {
      console.log(error);
      alert('Error deleting polygon!');
    }
  };

  return (
    <>
      <MapContainer
        center={userLocation || [51.505, -0.09]}
        zoom={type === 'polygon' ? 14 : zoomLevel}
        minZoom={3}
        style={{ height: '100vh', width: '100%' }}
        doubleClickZoom={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {type === 'polygon' ? (
          <NormalPolygon
            positions={positions}
            activePolygon={activePolygon}
            setActivePolygon={setActivePolygon}
            setPositions={setPositions}
          />
        ) : (
          <CirclePolygon
            center={center}
            setCenter={setCenter}
            radius={radius}
            setRadius={setRadius}
            setZoomLevel={setZoomLevel}
          />
        )}

        <Space className="button-group" direction="horizontal">
          {type === 'circle' && (
            <RangeInput
              value={radius}
              setValue={setRadius}
              zoomLevel={zoomLevel}
              center={center}
            />
          )}
          {id != 'new' && (
            <>
              <Button
                type="primary"
                onClick={handleDeletePolygon}
                className="my_polygons"
                danger
              >
                delete
              </Button>
            </>
          )}
          {(positions?.[0]?.length > 3 || center) && (
            <Button type="default" onClick={showModal} className="save-polygon">
              Save Polygon
            </Button>
          )}
          <Button
            type="default"
            onClick={() => {
              navigate('/');
              handleGetCenter(mapRef);
            }}
            className="save-polygon"
          >
            ×
          </Button>
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
            style={{ fontSize: '16px' }}
            value={polygonName}
          />
        </Modal>
      </MapContainer>
    </>
  );
};
