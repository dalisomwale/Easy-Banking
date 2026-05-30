import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiDollarSign,
  FiBookOpen,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiTrendingUp,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/members/${groupId}/${id}`);
        setMember(res.data);
      } catch (error) {
        toast.error("Failed to load member");
        navigate("/members");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [groupId, id, navigate]);

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!member) return null;

  return (
    <div className="max-w-4xl mx-auto px-2 space-y-5">
      <button
        onClick={() => navigate("/members")}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 transition"
      >
        <FiArrowLeft /> Back to Members
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {member.fullname}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FiPhone className="text-emerald-600" /> {member.phone}
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FiCalendar className="text-emerald-600" /> Joined:{" "}
              {new Date(member.join_date).toLocaleDateString()}
            </div>
            {member.address && (
              <div className="flex items-center gap-3 text-gray-600">
                <FiMapPin className="text-emerald-600" /> {member.address}
              </div>
            )}
            <div>
              <span
                className={`px-3 py-1 text-xs rounded-full ${member.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
              >
                {member.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings & Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Savings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FiDollarSign className="text-emerald-700" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Savings</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Total Savings:</span>
                <span className="font-semibold text-emerald-700">
                  K{toNumber(member.total_savings).toFixed(2)}
                </span>
              </div>
              {member.savings_history?.slice(0, 3).map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {new Date(s.date).toLocaleDateString()}
                  </span>
                  <span className="text-emerald-600">
                    +K{toNumber(s.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {member.savings_history?.length > 3 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  + {member.savings_history.length - 3} more
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loans Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FiBookOpen className="text-amber-700" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                Active Loans
              </h2>
            </div>
            {member.active_loans?.length ? (
              <div className="space-y-3">
                {member.active_loans.map((loan) => (
                  <div
                    key={loan.id}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">
                        K{toNumber(loan.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-amber-600">
                        K{toNumber(loan.remaining).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">
                        Due: {new Date(loan.due_date).toLocaleDateString()}
                      </span>
                      {role === "member" && (
                        <button
                          onClick={() =>
                            navigate(`/loans/${loan.id}/repayment`)
                          }
                          className="text-emerald-600 hover:text-emerald-800 text-xs flex items-center gap-1"
                        >
                          <FiTrendingUp size={12} /> Pay
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No active loans</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons - hidden for admin */}
      {role !== "admin" && (
        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate("/savings/add", { state: { memberId: member.id } })
            }
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <FiDollarSign /> Add Saving
          </button>
          <button
            onClick={() =>
              navigate("/loans/request", { state: { memberId: member.id } })
            }
            className="flex-1 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-2 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <FiBookOpen /> Request Loan
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;
