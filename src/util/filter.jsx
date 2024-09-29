import { memo } from "react";
import "./filter.css";
import PropTypes from "prop-types";

const FilterResult = ({ data, open, setOpen }) => {
  const removeOtherClickEvents = (e) => {
    e.stopPropagation();
  };
  return (
    <div className={`filter-result-container ${open && "open"}`}>
      <span className="action-button" onClick={setOpen}>
        {!open ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.4"
              d="M21.23 7.61998H15.69C15.31 7.61998 15 7.30998 15 6.91998C15 6.53998 15.31 6.22998 15.69 6.22998H21.23C21.61 6.22998 21.92 6.53998 21.92 6.91998C21.92 7.30998 21.61 7.61998 21.23 7.61998Z"
              fill="#101010"
            />
            <path
              opacity="0.4"
              d="M6.46008 7.61999H2.77008C2.39008 7.61999 2.08008 7.30999 2.08008 6.92999C2.08008 6.54999 2.39008 6.23999 2.77008 6.23999H6.46008C6.84008 6.23999 7.15008 6.54999 7.15008 6.92999C7.15008 7.30999 6.84008 7.61999 6.46008 7.61999Z"
              fill="#101010"
            />
            <path
              d="M10.15 10.84C12.3149 10.84 14.07 9.08496 14.07 6.92C14.07 4.75504 12.3149 3 10.15 3C7.98502 3 6.22998 4.75504 6.22998 6.92C6.22998 9.08496 7.98502 10.84 10.15 10.84Z"
              fill="#101010"
            />
            <path
              opacity="0.4"
              d="M21.2301 17.77H17.5401C17.1601 17.77 16.8501 17.46 16.8501 17.08C16.8501 16.7 17.1601 16.39 17.5401 16.39H21.2301C21.6101 16.39 21.9201 16.7 21.9201 17.08C21.9201 17.46 21.6101 17.77 21.2301 17.77Z"
              fill="#101010"
            />
            <path
              opacity="0.4"
              d="M8.31008 17.77H2.77008C2.39008 17.77 2.08008 17.46 2.08008 17.08C2.08008 16.7 2.39008 16.39 2.77008 16.39H8.31008C8.69008 16.39 9.00008 16.7 9.00008 17.08C9.00008 17.46 8.69008 17.77 8.31008 17.77Z"
              fill="#101010"
            />
            <path
              d="M13.8499 21C16.0149 21 17.7699 19.245 17.7699 17.08C17.7699 14.9151 16.0149 13.16 13.8499 13.16C11.685 13.16 9.92993 14.9151 9.92993 17.08C9.92993 19.245 11.685 21 13.8499 21Z"
              fill="#101010"
            />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.00098 5L19 18.9991"
              stroke="#101010"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.00007 18.9991L18.9991 5"
              stroke="#101010"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="result-box">
        <h3>Finded location</h3>
        <div>
          {data?.length > 0 ? (
            data?.map((point, index) => {
              return point ? (
                <div
                  key={index}
                  className="result-item"
                  onClick={removeOtherClickEvents}
                >
                  <h4>{point?.property_type}</h4>
                  <p>room number: {point?.rooms_number}</p>
                  <small>{point?.title}</small>
                </div>
              ) : null;
            })
          ) : (
            <span style={{ margin: "auto" }}>
              Select to minimum 4 coordinate{" "}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(FilterResult);

FilterResult.propTypes = {
  data: PropTypes.array,
  open: PropTypes.bool,
  setOpen: PropTypes.func,
};
