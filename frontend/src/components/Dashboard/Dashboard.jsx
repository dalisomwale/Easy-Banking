import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiBookOpen,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

const Dashboard = () => {
  const groupId = localStorage.getItem("selectedGroupId");
  const role = localStorage.getItem("selectedGroupRole");
  const [stats, setStats] = useState({
    total_members: 0,
    total_savings: 0,
    active_loans_count: 0,
    total_loans_amount: 0,
    total_repayments: 0,
    total_funds: 0,
    recent_transactions: [],
  });
  const [memberLoanTotal, setMemberLoanTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState(localStorage.getItem("member_id"));

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    const fetchMemberId = async () => {
      if (!groupId || role !== "member") return;
      try {
        const res = await api.get(`/members/member-id/${groupId}`);
        localStorage.setItem("member_id", res.data.member_id);
        setMemberId(res.data.member_id);
      } catch (err) {
        console.error("Failed to fetch member_id:", err);
      }
    };
    if (role === "member" && !memberId) fetchMemberId();
  }, [groupId, role, memberId]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get(`/reports/dashboard/${groupId}`);
        const data = res.data;
        setStats({
          total_members: toNumber(data.total_members),
          total_savings: toNumber(data.total_savings),
          active_loans_count: toNumber(data.active_loans_count),
          total_loans_amount: toNumber(data.total_loans_amount),
          total_repayments: toNumber(data.total_repayments),
          total_funds: toNumber(data.total_funds),
          recent_transactions: (data.recent_transactions || []).map((tx) => ({
            ...tx,
            amount: toNumber(tx.amount),
          })),
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard stats");
      }
    };

    const fetchMemberLoanSummary = async () => {
      if (!groupId || !memberId) return;
      try {
        const res = await api.get(`/loans/summary/${groupId}/${memberId}`);
        setMemberLoanTotal(toNumber(res.data.total_outstanding));
      } catch (error) {
        console.error("Failed to load loan summary", error);
      }
    };

    const loadData = async () => {
      setLoading(true);
      await fetchDashboardStats();
      if (role === "member" && memberId) await fetchMemberLoanSummary();
      setLoading(false);
    };
    if (groupId) loadData();
  }, [groupId, role, memberId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );

  const formatMoney = (value) => `K${value.toFixed(2)}`;

  // Admin Dashboard with orange accents
  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-700 text-sm font-medium">
                Total Group Funds
              </p>
              <p className="text-3xl font-bold text-emerald-800 mt-2">
                {formatMoney(stats.total_funds)}
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                Savings + Repayments
              </p>
            </div>
            <div className="bg-emerald-200 p-3 rounded-full">
              <FiDollarSign className="text-emerald-700" size={28} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">
                {stats.total_members}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <FiUsers className="text-emerald-600" size={28} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Loans</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {stats.active_loans_count}
              </p>
              <p className="text-xs text-gray-400">
                Total: {formatMoney(stats.total_loans_amount)}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <FiBookOpen className="text-amber-600" size={28} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Savings</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">
                {formatMoney(stats.total_savings)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <FiTrendingUp className="text-emerald-600" size={28} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FiActivity className="text-amber-500" size={20} />
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Activity
            </h2>
          </div>
        </div>
        <div className="p-6">
          {stats.recent_transactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recent_transactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {tx.member_name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {tx.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${tx.type === "saving" ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {tx.type === "saving" ? "+" : "-"}{" "}
                      {formatMoney(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Member Dashboard (unchanged but keep orange for loan)
  const MemberDashboard = () => (
    <div className="space-y-5 max-w-md mx-auto px-2">
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-700 text-sm font-medium">Group Funds</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">
              {formatMoney(stats.total_funds)}
            </p>
            <p className="text-xs text-emerald-600 mt-2">
              Savings + repayments
            </p>
          </div>
          <div className="bg-emerald-200 p-3 rounded-full">
            <FiUsers className="text-emerald-700" size={28} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Savings
              </p>
              <p className="text-xl font-semibold text-emerald-700 mt-1">
                {formatMoney(stats.total_savings)}
              </p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-full">
              <FiDollarSign className="text-emerald-600" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                Outstanding Loan
              </p>
              <p className="text-xl font-semibold text-amber-600 mt-1">
                {formatMoney(memberLoanTotal)}
              </p>
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <FiTrendingUp className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
          <FiActivity className="text-amber-500" size={18} />
          <h2 className="text-lg font-semibold text-gray-700">
            Recent Activity
          </h2>
        </div>
        {stats.recent_transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-sm">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-4">
            {stats.recent_transactions.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{tx.member_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{tx.type}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${tx.type === "saving" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {tx.type === "saving" ? "+" : "-"} {formatMoney(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return role === "admin" ? <AdminDashboard /> : <MemberDashboard />;
};
export default Dashboard;
