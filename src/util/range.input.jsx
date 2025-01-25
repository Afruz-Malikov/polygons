import PropTypes from "prop-types";
import { memo, useState, useEffect } from "react";
import { useMap } from "react-leaflet";

const RangeInput = ({ value, setValue, main = false, center }) => {
  const [viewportWidth, viewportHeight] = useViewportSize();
  const maxRadius = useMaxMetersInDevice(viewportHeight, viewportWidth, center);
  const [inputMaxValue, setInputMaxValue] = useState(()=> Math.max(value, maxRadius));
  
  useEffect(() => {
    setInputMaxValue(Math.max(value, maxRadius));
  },[maxRadius]);

  const handleInputChange = (e) => {
    e.stopPropagation();
    setValue(Number(e.target.value));
  };

  // useEffect(() => {
  //   const calculateMaxValue = (zoom) => {
  //     const maxRadius = 4000000;
  //     const minRadius = 200;
  //     const normalizedZoom = (zoom - 3) / (18 - 3);
  //     const max = maxRadius - normalizedZoom * (maxRadius - minRadius);
  //     return Math.round(max);
  //   };

  //   setMaxValue(calculateMaxValue(zoomLevel));
  // }, [zoomLevel]);

  return (
    <section className={`df aic gap3 range-slider ${main ? "main" : ""}`}>
      <input
        type="text"
        className="range-slider__input"
        value={value}
        onChange={handleInputChange}
      />
      <input
        className="range-slider__range"
        type="range"
        name="range"
        max={inputMaxValue}
        min={200}
        value={value}
        onChange={handleInputChange}
        onPointerUp={()=> {setInputMaxValue(Math.max(value, maxRadius))}}
      />
      <span className="fw3 range-slider__title">{inputMaxValue}</span>
    </section>
  );
};

export default memo(RangeInput);

RangeInput.propTypes = {
  value: PropTypes.number,
  setValue: PropTypes.func,
  main: PropTypes.bool,
  zoomLevel: PropTypes.number,
};

export const GetMapCenterButton = () => {
  const map = useMap();

  const handleGetCenter = () => {
    const center = map.getCenter();
    console.log("Haritanın Merkezi:", center);
  };

  return (
    <button
      onClick={handleGetCenter}
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1000,
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "5px",
        border: "none",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
      }}
    >
      Harita Merkezini Al
    </button>
  );
};


const useMaxMetersInDevice = (viewportHeight, viewportWidth, center) => {
  const map = useMap();
  const [maxRadiusInDevice, setMaxRadiusInDevice] = useState(0);

  useEffect(() => {
    const maxRadiusInDevice = () => {
      if (!map) return 0;
     
      const pointOfCenterViewport = map.containerPointToLatLng([viewportWidth/2, viewportHeight/2]);
      const newPoint = map.containerPointToLatLng([viewportWidth/2, viewportHeight/2+100]);
  
      const metersIn100Px = pointOfCenterViewport.distanceTo(newPoint);
      
      const radiusInMeters = Math.round(Math.max(viewportWidth*metersIn100Px/200, viewportHeight*metersIn100Px/200));
  
      return radiusInMeters;
    };

    setMaxRadiusInDevice(maxRadiusInDevice());
    
  }, [viewportHeight, viewportWidth, map._zoom, center]);
  

  return maxRadiusInDevice;
};


const useViewportSize = () => {
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    console.log(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return [viewportSize.width, viewportSize.height];
}
