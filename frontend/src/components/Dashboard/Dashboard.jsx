import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiBookOpen,
  FiAlertTriangle,
  FiPercent,
  FiArrowUpRight,
} from "react-icons/fi";
import api from "../../services/api";
import toast from "react-hot-toast";

// ─── Shared header ──────────────────────────────────────────────────────
const GroupHeader = () => {
  const groupName = localStorage.getItem("selectedGroupName") || "My Group";
  const role = localStorage.getItem("selectedGroupRole");
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
          {groupName}
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#A7F3D0",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {role === "admin" ? "Admin Dashboard" : "Member Dashboard"}
        </p>
      </div>
    </div>
  );
};

// ─── Floating hero fund card ───────────────────────────────────────────
const HeroFundCard = ({ label, amount, sub, icon: Icon }) => (
  <div
    style={{
      padding: "0 1rem",
      marginTop: "-1.75rem",
      position: "relative",
      zIndex: 2,
    }}
  >
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #E5E7EB",
        borderRadius: 16,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 11,
            color: "#6B7280",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#065F46",
            margin: "4px 0 2px",
            lineHeight: 1,
          }}
        >
          {amount}
        </p>
        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{sub}</p>
      </div>
      <div
        style={{
          background: "#D1FAE5",
          borderRadius: "50%",
          width: 50,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon color="#065F46" size={22} />
      </div>
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
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
  const [fineSummary, setFineSummary] = useState({
    total_fines: 0,
    paid_fines: 0,
    outstanding: 0,
  });
  const [adminFineStats, setAdminFineStats] = useState({
    total_issued: 0,
    total_paid: 0,
    outstanding: 0,
  });
  const [totalInterest, setTotalInterest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState(localStorage.getItem("member_id"));
  const [totalMembers, setTotalMembers] = useState(0);

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const formatMoney = (value) => `K${value.toFixed(2)}`;

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

    const fineRes = await api.get(`/fines/stats/${groupId}`);
    setAdminFineStats({
      total_issued: toNumber(fineRes.data.total_issued),
      total_paid: toNumber(fineRes.data.total_paid),
      outstanding: toNumber(fineRes.data.outstanding),
    });

    const interestRes = await api.get(`/loans/interest/${groupId}`);
    setTotalInterest(toNumber(interestRes.data.total_interest));
  }, [groupId]);

  const fetchMemberDashboard = useCallback(async () => {
    if (!memberId) return;

    try {
      const membersRes = await api.get(`/members/${groupId}`);
      setTotalMembers(membersRes.data.length);
    } catch (err) {
      console.error("Failed to fetch members count:", err);
    }

    const savingsRes = await api.get(`/savings/member/${groupId}/${memberId}`);
    const mySavings = savingsRes.data.savings || [];
    const myTotalSavings = toNumber(savingsRes.data.total_savings);

    const loansRes = await api.get(`/loans/history/${groupId}/${memberId}`);
    const myLoans = loansRes.data || [];

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

    const summaryRes = await api.get(`/loans/summary/${groupId}/${memberId}`);
    const outstanding = toNumber(summaryRes.data.total_outstanding);

    const fundsRes = await api.get(`/loans/group/funds/${groupId}`);
    const totalFunds = toNumber(fundsRes.data.total_funds);

    const fineRes = await api.get(`/fines/summary/${groupId}/${memberId}`);
    setFineSummary({
      total_fines: toNumber(fineRes.data.total_fines),
      paid_fines: toNumber(fineRes.data.paid_fines),
      outstanding: toNumber(fineRes.data.outstanding),
    });

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

  // ── Admin Dashboard ────────────────────────────────────────────────────
  const AdminDashboard = () => {
    const totalProfit = totalInterest + adminFineStats.total_paid;
    return (
      <div className="px-2 sm:px-4">
        <GroupHeader />
        <HeroFundCard
          label="Total Group Funds"
          amount={formatMoney(stats.total_funds)}
          sub="Savings + repayments"
          icon={FiTrendingUp}
        />

        {/* 🔥 Cards – responsive: 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-5">
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Members
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700 mt-1 sm:mt-2">
                {stats.total_members}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Savings
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700 mt-1 sm:mt-2">
                {formatMoney(stats.total_savings)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Profit
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600 mt-1 sm:mt-2">
                {formatMoney(totalProfit)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Fines
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
                {formatMoney(adminFineStats.total_issued)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Interest
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-600 mt-1 sm:mt-2">
                {formatMoney(totalInterest)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-5 mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FiActivity className="text-amber-500" size={20} />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Recent Activity
              </h2>
            </div>
          </div>
          <div className="p-4 sm:p-6">
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
                        className={`font-semibold ${
                          tx.type === "saving"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
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
  };

  // ── Member Dashboard ── (unchanged, already mobile‑friendly)
  const MemberDashboard = () => (
    <div className="max-w-md mx-auto">
      <GroupHeader />

      <HeroFundCard
        label="Group Funds"
        amount={formatMoney(stats.total_funds)}
        sub="Savings + repayments"
        icon={FiUsers}
      />

      <div className="mt-4 px-4">
        {/* Top row: Savings | Loan */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              Savings
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {formatMoney(stats.total_savings)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              Loan
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatMoney(memberLoanTotal)}
            </p>
            {memberLoanTotal > 0 ? (
              <p className="text-xs text-amber-500 mt-0.5">Active</p>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5"></p>
            )}
          </div>
        </div>

        {/* Bottom row: Fines | Total Members */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              Fines
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatMoney(fineSummary.total_fines)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">
              Members
            </p>
            <p className="text-2xl font-bold text-gray-700 mt-1">
              {totalMembers}
            </p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl mx-4 mt-4 mb-6 p-5 shadow-sm border border-gray-100">
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
                    className={`font-semibold ${
                      tx.type === "saving"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
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
