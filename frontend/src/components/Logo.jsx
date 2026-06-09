import React from "react";

const Logo = ({ size = "default", showText = true, variant = "light" }) => {
  const sizeClasses = {
    small: "text-lg",
    default: "text-xl",
    large: "text-2xl",
  };

  const iconSizes = {
    small: 22,
    default: 26,
    large: 32,
  };

  const currentSize = iconSizes[size] || 26;

  const textColor = variant === "light" ? "text-white" : "text-emerald-700";
  const iconBg = variant === "light" ? "bg-white/10" : "bg-white";
  const iconColor = variant === "light" ? "text-white" : "text-emerald-700";

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-md ${iconBg}`}>
        <svg
          width={currentSize}
          height={currentSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={iconColor}
        >
          <path
            d="M4 9.5L12 4L20 9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect
            x="6"
            y="9.5"
            width="12"
            height="12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <line
            x1="9"
            y1="12"
            x2="9"
            y2="21.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <line
            x1="12"
            y1="12"
            x2="12"
            y2="21.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <line
            x1="15"
            y1="12"
            x2="15"
            y2="21.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </div>
      {showText && (
        <span
          className={`font-semibold tracking-wide ${sizeClasses[size]} ${textColor}`}
        >
          Umozi Savings
        </span>
      )}
    </div>
  );
};

export default Logo;
