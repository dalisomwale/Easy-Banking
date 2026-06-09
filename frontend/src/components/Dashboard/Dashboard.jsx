import React, { useState, useEffect, useCallback } from "react";
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

  const formatMoney = (value) => `K${value.toFixed(2)}`;

  // Helper to get member_id if not already stored
  useEffect(() => {
    const fetchMemberId = async () => {
      if (!groupId || role !== "member") return;
      if (memberId) return;
      try {
        const res = await api.get(`/members/member-id/${groupId}`);
        localStorage.setItem("member_id", res.data.member_id);
        setMemberId(res.data.member_id);
      } catch (err) {
        console.error("Failed to fetch member_id:", err);
      }
    };
    fetchMemberId();
  }, [groupId, role, memberId]);

  // Admin dashboard data fetch (memoized)
  const fetchAdminDashboard = useCallback(async () => {
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
  }, [groupId]);

  // Member dashboard data fetch (memoized)
  const fetchMemberDashboard = useCallback(async () => {
    if (!memberId) return;

    // 1. Get member's savings
    const savingsRes = await api.get(`/savings/member/${groupId}/${memberId}`);
    const mySavings = savingsRes.data.savings || [];
    const myTotalSavings = toNumber(savingsRes.data.total_savings);

    // 2. Get member's loan history (includes repayments)
    const loansRes = await api.get(`/loans/history/${groupId}/${memberId}`);
    const myLoans = loansRes.data || [];

    // 3. Build recent transactions (savings + repayments)
    const savingTransactions = mySavings.map((s) => ({
      member_name: "You",
      type: "saving",
      amount: toNumber(s.amount),
      date: s.date,
    }));

    const repaymentTransactions = [];
    myLoans.forEach((loan) => {
      if (loan.repayments && loan.repayments.length) {
        loan.repayments.forEach((rep) => {
          repaymentTransactions.push({
            member_name: "You",
            type: "repayment",
            amount: toNumber(rep.amount_paid),
            date: rep.payment_date,
          });
        });
      }
    });

    let allTx = [...savingTransactions, ...repaymentTransactions];
    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTx = allTx.slice(0, 10);

    // 4. Get member's loan summary (outstanding)
    const summaryRes = await api.get(`/loans/summary/${groupId}/${memberId}`);
    const outstanding = toNumber(summaryRes.data.total_outstanding);

    // 5. Group total funds (visible to everyone)
    const fundsRes = await api.get(`/loans/group/funds/${groupId}`);
    const totalFunds = toNumber(fundsRes.data.total_funds);

    setMemberLoanTotal(outstanding);
    setStats({
      total_members: 0,
      total_savings: myTotalSavings,
      active_loans_count: 0,
      total_loans_amount: 0,
      total_repayments: 0,
      total_funds: totalFunds,
      recent_transactions: recentTx,
    });
  }, [groupId, memberId]);

  // Main load effect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (role === "admin") {
          await fetchAdminDashboard();
        } else if (role === "member" && memberId) {
          await fetchMemberDashboard();
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    if (groupId) loadData();
  }, [groupId, role, memberId, fetchAdminDashboard, fetchMemberDashboard]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Admin Dashboard (unchanged)
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

  // Member Dashboard – shows personal data only
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
                My Savings
              </p>
              <p className="text-xl font-semibold text-emerald-700 mt-1">
                {formatMoney(stats.total_savings)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">
                My Loan
              </p>
              <p className="text-xl font-semibold text-amber-600 mt-1">
                {formatMoney(memberLoanTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-3">
          <FiActivity className="text-amber-500" size={18} />
          <h2 className="text-lg font-semibold text-gray-700">
            My Recent Activity
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
                  <p className="font-medium text-gray-800 capitalize">
                    {tx.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${tx.type === "saving" ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {tx.type === "saving" ? "+" : "-"} {formatMoney(tx.amount)}
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
