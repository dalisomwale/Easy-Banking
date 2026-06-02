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
        navigate("/app/members"); // ✅ fixed
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [groupId, id, navigate]);

  const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!member) return null;

  return (
    <div className="max-w-4xl mx-auto px-2 space-y-5">
      <button
        onClick={() => navigate("/app/members")} // ✅ fixed
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 transition"
      >
        <FiArrowLeft /> Back to Members
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {member.fullname}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3">
              <FiPhone className="text-emerald-600" /> {member.phone}
            </div>
            <div className="flex items-center gap-3">
              <FiCalendar className="text-emerald-600" /> Joined:{" "}
              {new Date(member.join_date).toLocaleDateString()}
            </div>
            {member.address && (
              <div className="flex items-center gap-3">
                <FiMapPin className="text-emerald-600" /> {member.address}
              </div>
            )}
            <div>
              <span
                className={`inline-flex px-3 py-1 text-xs rounded-full ${
                  member.status === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {member.status}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FiDollarSign className="text-emerald-700" />
              </div>
              <h2 className="text-lg font-semibold">Savings</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span>Total Savings:</span>
                <span className="font-semibold text-emerald-700">
                  K{toNumber(member.total_savings).toFixed(2)}
                </span>
              </div>
              {member.savings_history?.slice(0, 3).map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>{new Date(s.date).toLocaleDateString()}</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FiBookOpen className="text-amber-700" />
              </div>
              <h2 className="text-lg font-semibold">Active Loans</h2>
            </div>
            {member.active_loans?.length ? (
              <div className="space-y-3">
                {member.active_loans.map((loan) => (
                  <div key={loan.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between text-sm">
                      <span>Amount:</span>
                      <span className="font-medium">
                        K{toNumber(loan.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
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
                            navigate(`/app/loans/${loan.id}/repayment`)
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
      {role !== "admin" && (
        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate("/app/savings/add", { state: { memberId: member.id } })
            }
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <FiDollarSign /> Add Saving
          </button>
          <button
            onClick={() =>
              navigate("/app/loans/request", { state: { memberId: member.id } })
            }
            className="flex-1 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <FiBookOpen /> Request Loan
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;
