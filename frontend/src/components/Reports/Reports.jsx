import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiDownload, FiUsers, FiDollarSign, FiBookOpen } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

// ── Shared GroupHeader ──
const GroupHeader = ({ title }) => {
  const groupName = localStorage.getItem("selectedGroupName") || "My Group";
  const displayTitle = title || groupName;
  return (
    <div
      style={{
        background: "#064E3B",
        borderRadius: "0 0 2rem 2rem",
        padding: "1.5rem 1.5rem 3.75rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: "30%",
          width: 240,
          height: 240,
          background: "rgba(255,255,255,0.04)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.3px",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {displayTitle}
        </p>
      </div>
    </div>
  );
};

const Reports = () => {
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const groupRole = localStorage.getItem("selectedGroupRole");
  const [summary, setSummary] = useState({
    total_members: 0,
    total_savings: 0,
    active_loans_count: 0,
    total_loans_amount: 0,
    total_repayments: 0,
  });
  const [loading, setLoading] = useState(true);

  // ── mobile detection ──
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (groupRole !== "admin") {
      toast.error("Access denied. Only group admins can view reports.");
      navigate("/");
      return;
    }
    if (groupId) fetchSummary();
  }, [groupId, groupRole, navigate]);

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/reports/dashboard/${groupId}`);
      setSummary(res.data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Metric", "Value"];
    const data = [
      ["Total Members", summary.total_members],
      ["Total Savings", `K${summary.total_savings.toFixed(2)}`],
      ["Active Loans", summary.active_loans_count],
      ["Total Loans Amount", `K${summary.total_loans_amount.toFixed(2)}`],
      ["Total Repayments", `K${summary.total_repayments.toFixed(2)}`],
      ["Report Date", new Date().toLocaleString()],
    ];
    const csv = [headers, ...data].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `easybanking_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2">
      {/* Mobile header */}
      {isMobile && <GroupHeader title="Manage Reports" />}

      {/* Desktop heading – hidden on mobile */}
      {!isMobile && (
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports</h1>
          <button
            onClick={exportCSV}
            className="btn-primary flex items-center gap-2"
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded">
              <FiUsers className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Member Stats</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Members:</span>
              <span className="font-semibold">{summary.total_members}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Loan Holders:</span>
              <span className="font-semibold">
                {summary.active_loans_count}
              </span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded">
              <FiDollarSign className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">
              Financial Summary (Kwacha)
            </h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Savings:</span>
              <span className="text-green-600">
                K{summary.total_savings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Loans Issued:</span>
              <span className="text-orange-600">
                K{summary.total_loans_amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Repayments:</span>
              <span className="text-blue-600">
                K{summary.total_repayments.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Report Info</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Data as of {new Date().toLocaleDateString()}</p>
          <p>• All amounts in Zambian Kwacha (K)</p>
          <p>• Active loans = not fully repaid</p>
          <p>• Generated by Easy Banking System</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
