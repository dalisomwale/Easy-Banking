import React, { useEffect } from "react";
import Logo from "./Logo";

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emerald-700">
      <div className="text-center animate-pulse">
        <Logo size="large" showText={true} variant="light" />
        <div className="mt-6 text-emerald-100 text-sm">Loading...</div>
        <div className="absolute bottom-8 left-0 right-0 text-center text-emerald-300 text-xs">
          v.26.0.1
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
