import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDollarSign } from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const SavingHistory = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const groupId = localStorage.getItem("selectedGroupId");
  const [data, setData] = useState({ savings: [], total_savings: 0 });
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch savings
        const savingsRes = await api.get(
          `/savings/member/${groupId}/${memberId}`,
        );
        setData(savingsRes.data);

        // Optionally fetch member name (if needed)
        try {
          const membersRes = await api.get(`/members/${groupId}`);
          const member = membersRes.data.find((m) => m.id == memberId);
          if (member) setMemberName(member.fullname);
        } catch (e) {
          console.error("Could not fetch member name");
        }
      } catch (error) {
        toast.error("Failed to load savings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId, memberId]);

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const formatMoney = (value) => `K${value.toFixed(2)}`;

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-2">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4 transition"
      >
        <FiArrowLeft /> Back
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          {memberName && (
            <p className="text-gray-600 mb-1">Member: {memberName}</p>
          )}
          <h2 className="text-2xl font-bold text-gray-800">Savings History</h2>
          <div className="mt-3 mb-6">
            <div className="bg-emerald-50 inline-block px-4 py-2 rounded-lg border border-emerald-100">
              <p className="text-sm text-emerald-700 font-medium">
                Total Savings
              </p>
              <p className="text-2xl font-bold text-emerald-800">
                {formatMoney(toNumber(data.total_savings))}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {data.savings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No savings records
              </p>
            ) : (
              data.savings.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-emerald-600">
                      +K{toNumber(s.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{s.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">
                      {new Date(s.date).toLocaleDateString()}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingHistory;
