import PropTypes from "prop-types";

export const RangeInput = ({ title, value, setValue }) => {
  const handleInputChange = (e) => {
    e.stopPropagation();
    setValue(Number(e.target.value));
  };

  const incrementValue = () => {
    if (value < 5000) {
      setValue((prev) => prev + 1);
    }
  };

  const decrementValue = () => {
    if (value > 0) {
      setValue((prev) => prev - 1);
    }
  };

  return (
    <section className="df aic gap3 range-slider">
      <span className="fs2 fw3 range-slider__title">{title}</span>
      <input
        className="range-slider__range"
        type="range"
        name="range"
        max={5000}
        min={0}
        value={value}
        onChange={handleInputChange}
      />
      <span className="fs2 range-slider__value">{value}</span>
      <div className="df fdc aic counter">
        <i
          className="cp counter-plus"
          onClick={incrementValue}
        >▲</i>
        <i
          className="cp counter-minus"
          onClick={decrementValue}
        >▼</i>
      </div>
    </section>
  );
};

RangeInput.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number,
  setValue: PropTypes.func,
};
