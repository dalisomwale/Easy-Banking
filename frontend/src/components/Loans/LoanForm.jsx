import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiUser,
  FiDollarSign,
  FiPercent,
  FiCalendar,
  FiClock,
  FiSave,
} from "react-icons/fi";

const LoanForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const groupId = localStorage.getItem("selectedGroupId");
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    member_id: location.state?.memberId || "",
    amount: "",
    interest_rate: "5",
    duration_months: "6",
    issue_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/members/${groupId}`);
        setMembers(res.data);
      } catch (error) {
        toast.error("Failed to load members");
      }
    };
    if (groupId) fetchMembers();
  }, [groupId]);

  const calculateTotal = () => {
    const amt = parseFloat(formData.amount) || 0;
    const interest = parseFloat(formData.interest_rate) || 0;
    return amt + (amt * interest) / 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.member_id ||
      !formData.amount ||
      parseFloat(formData.amount) <= 0
    )
      return toast.error("Please fill all fields");
    setLoading(true);
    try {
      await api.post("/loans", { ...formData, groupId });
      toast.success("Loan issued");
      navigate("/loans");
    } catch (error) {
      toast.error("Failed to issue loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Issue New Loan</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="input-field pl-10"
            value={formData.member_id}
            onChange={(e) =>
              setFormData({ ...formData, member_id: e.target.value })
            }
            required
          >
            <option value="">Select Member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullname} - {m.phone}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            step="0.01"
            className="input-field pl-10"
            placeholder="Loan Amount (Kwacha) *"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>
        <div className="relative">
          <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            step="0.5"
            className="input-field pl-10"
            placeholder="Interest Rate (%)"
            value={formData.interest_rate}
            onChange={(e) =>
              setFormData({ ...formData, interest_rate: e.target.value })
            }
          />
        </div>
        <div className="relative">
          <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="input-field pl-10"
            value={formData.duration_months}
            onChange={(e) =>
              setFormData({ ...formData, duration_months: e.target.value })
            }
            required
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="9">9 months</option>
            <option value="12">12 months</option>
          </select>
        </div>
        <div className="relative">
          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            className="input-field pl-10"
            value={formData.issue_date}
            onChange={(e) =>
              setFormData({ ...formData, issue_date: e.target.value })
            }
            required
          />
        </div>
        {formData.amount && (
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm font-semibold mb-1">Summary</p>
            <div className="flex justify-between text-sm">
              <span>Principal:</span>
              <span>K{parseFloat(formData.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Interest ({formData.interest_rate}%):</span>
              <span>
                K
                {(
                  (parseFloat(formData.amount) *
                    parseFloat(formData.interest_rate)) /
                  100
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t">
              <span>Total Due:</span>
              <span>K{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            <FiSave /> {loading ? "Issuing..." : "Issue Loan"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/loans")}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
