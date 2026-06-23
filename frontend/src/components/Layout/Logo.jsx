import React from "react";

const Logo = ({
  size = "default",
  showText = true,
  showSubtitle = false,
  glass = false,
  variant = "light",
}) => {
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
  const iconColor = "text-amber-500";
  const iconBg = variant === "light" ? "bg-white/10" : "bg-white";

  if (glass) {
    return (
      <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-full max-w-sm md:max-w-md overflow-hidden border border-white/[0.12] ring-1 ring-white/[0.05]">
        <div className="px-6 sm:px-8 pt-7 sm:pt-9 pb-6 text-center border-b border-white/[0.08]">
          <div className="flex justify-center mb-3">
            <div className="bg-white/[0.08] p-2.5 rounded-xl border border-white/[0.12]">
              <svg
                width={36}
                height={36}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-amber-300"
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
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Umozi Savings
          </h1>
          <p className="text-emerald-200/70 text-xs sm:text-sm mt-1">
            A Village Banking System
          </p>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-col">
          <span
            className={`font-semibold tracking-wide ${sizeClasses[size]} ${textColor}`}
          >
            Umozi Savings
          </span>
          {showSubtitle && (
            <span
              className={`text-xs ${variant === "light" ? "text-emerald-200/70" : "text-emerald-600/70"}`}
            >
              A Village Banking System
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
