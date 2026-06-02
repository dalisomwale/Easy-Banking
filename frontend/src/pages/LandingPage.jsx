import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiTrendingUp,
  FiShield,
  FiGlobe,
  FiMail,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FiUsers,
      title: "Member Management",
      description:
        "Easily manage group members, track their profiles, savings, and loan history.",
    },
    {
      icon: FiDollarSign,
      title: "Savings Tracking",
      description:
        "Record and monitor member savings with detailed reports and history.",
    },
    {
      icon: FiBookOpen,
      title: "Loan Management",
      description:
        "Request, approve, and manage loans with interest calculations and repayment tracking.",
    },
    {
      icon: FiTrendingUp,
      title: "Financial Reports",
      description:
        "Generate insightful reports on group funds, active loans, and member contributions.",
    },
    {
      icon: FiShield,
      title: "Secure & Reliable",
      description:
        "Your data is protected with modern authentication and encrypted storage.",
    },
    {
      icon: FiGlobe,
      title: "Anywhere Access",
      description:
        "Access your village banking group from anywhere, on any device.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-3 rounded-2xl">
                <svg
                  width={64}
                  height={64}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
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
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Easy Bank
              <span className="block text-emerald-200 text-2xl md:text-3xl mt-2">
                A Village Banking System
              </span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto mb-8">
              Designed for village banking groups to manage savings, loans,
              repayments and share outs easily and transparently.
            </p>
            <div className="flex flex-row flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate("/login")}
                className="bg-amber-500/80 backdrop-blur-sm hover:bg-amber-500 text-white px-8 py-2 rounded-lg font-semibold transition shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Our Features
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Everything you need to run your village banking group efficiently.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-2 md:mb-3">
                    <div className="bg-amber-100 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="text-amber-600" size={18} />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section – Dark Glassmorphic Card with inline buttons on all screens */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-gray-700 mb-6">
              Create an account join a group or create your own and start
              managing savings and loans with ease.
            </p>
            {/* Buttons inline on mobile and desktop */}
            <div className="flex flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/login")}
                className="bg-emerald-600/80 backdrop-blur-sm hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-amber-500/80 backdrop-blur-sm hover:bg-amber-500 text-white px-5 py-2 rounded-lg font-semibold transition"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-emerald-900 text-emerald-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-lg">
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-amber-400"
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
              <span className="font-semibold">Easy Banking</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-center">
              <div className="flex items-center gap-2">
                <FiMail className="text-amber-400" size={14} />
                <span>easybank@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-amber-400" size={14} />
                <span>+260 772 387 373</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="text-amber-400" size={14} />
                <span>Lusaka, Zambia</span>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-emerald-300/70 mt-6 pt-4 border-t border-emerald-800">
            &copy; 2026 Easy Banking – Village Banking System. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
