import React, { useState } from "react";

export default function Tooltip({ children, content, direction = "top" }) {
  const [visible, setVisible] = useState(false);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  // For mobile support
  const toggleTooltip = () => setVisible(!visible);

  const getPositionClasses = () => {
    switch (direction) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={toggleTooltip}
        onTouchStart={toggleTooltip}
        className="inline-block cursor-pointer"
        role="button"
        tabIndex="0"
        aria-label="Click for definition"
      >
        {children}
      </div>
      
      {visible && (
        <div
          className={`absolute z-50 ${getPositionClasses()} w-64 p-3 text-sm text-gray-200 bg-gray-800 rounded-lg border border-gray-700 shadow-lg transition-opacity duration-200`}
        >
          <div className="font-medium mb-1">What is this?</div>
          <div>{content}</div>
          <div className="absolute w-3 h-3 bg-gray-800 border-l border-b border-gray-700 transform rotate-45 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      )}
    </div>
  );
}