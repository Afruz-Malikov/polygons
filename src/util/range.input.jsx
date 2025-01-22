import PropTypes from "prop-types";
import { memo, useState } from "react";
import { useMap } from "react-leaflet";

const RangeInput = ({ title, value, setValue, main = false }) => {
  const [maxValue, setMaxValue] = useState(100000); // 6371000
  const handleInputChange = (e) => {
    e.stopPropagation();
    const value = Number(e.target.value);
    if (value > 90000) {
      setMaxValue(600000);
    }
    if (value > 500000) {
      setMaxValue(1000000);
    }
    if (value > 900000) {
      setMaxValue(2000000);
    }
    if (value > 1900000) {
      setMaxValue(4000000);
    }
    if (value > 3900000) {
      setMaxValue(6371000);
    }
    setValue(value);
  };

  return (
    <section className={`df aic gap3 range-slider ${main ? "main" : ""}`}>
      <span className="fw3 range-slider__title">{title}</span>
      <input
        className="range-slider__range"
        type="range"
        name="range"
        max={maxValue}
        min={0}
        value={value}
        onChange={handleInputChange}
      />
      <input
        type="text"
        className="range-slider__input"
        value={value}
        onChange={handleInputChange}
      />
    </section>
  );
};

export default memo(RangeInput);

RangeInput.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number,
  setValue: PropTypes.func,
  main: PropTypes.bool,
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
