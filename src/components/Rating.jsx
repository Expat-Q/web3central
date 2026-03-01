import React, { useState } from "react";

const Rating = ({ initialRating = 0, onRate, readonly = false }) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const value = index + 1;
        return (
          <button
            type="button"
            key={value}
            disabled={readonly}
            className={`text-xl transition-all duration-200 ${value <= (hover || rating)
              ? "text-yellow-400 scale-110"
              : "text-gray-700 hover:text-gray-600"
              } ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}
            onClick={() => {
              if (!readonly) {
                setRating(value);
                if (onRate) onRate(value);
              }
            }}
            onMouseEnter={() => !readonly && setHover(value)}
            onMouseLeave={() => !readonly && setHover(rating)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};

export default Rating;