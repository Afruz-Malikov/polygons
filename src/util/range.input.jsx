import PropTypes from "prop-types";
import { memo, useState, useEffect } from "react";
import { useMap } from "react-leaflet";

const RangeInput = ({ value, setValue, main = false, zoomLevel }) => {
  const [maxValue, setMaxValue] = useState(200);
  const handleInputChange = (e) => {
    e.stopPropagation();
    setValue(Number(e.target.value));
  };

  useEffect(() => {
    const calculateMaxValue = (zoom) => {
      if (zoom >= 17) return 200;
      if (zoom >= 14) return 10000;
      const maxRadius = 4000000;
      const minRadius = 200;
      const normalizedZoom = (zoom - 3) / (13 - 3);
      const max = maxRadius - normalizedZoom * (maxRadius - minRadius);
      return Math.round(max);
    };

    setMaxValue(calculateMaxValue(zoomLevel));
  }, [zoomLevel]);

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
        max={maxValue}
        min={0}
        value={value}
        onChange={handleInputChange}
      />
      <span className="fw3 range-slider__title">{maxValue}</span>
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
