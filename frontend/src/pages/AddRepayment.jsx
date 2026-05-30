import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiDollarSign, FiCalendar, FiCreditCard, FiSave } from "react-icons/fi";

const AddRepayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState(null);
  const [formData, setFormData] = useState({
    loan_id: id,
    amount_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
  });

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      const response = await api.get(`/loans/${id}`);
      setLoan(response.data);
    } catch (error) {
      toast.error("Failed to load loan details");
      navigate("/loans");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(formData.amount_paid) > loan.remaining) {
      toast.error(
        `Amount cannot exceed remaining balance of $${loan.remaining.toFixed(2)}`,
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/loans/repayment", formData);
      toast.success("Repayment recorded successfully!");
      navigate(`/loans/${id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to record repayment",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Make Loan Repayment
      </h1>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Loan Information</h3>
        <p className="text-sm text-gray-600">Member: {loan.fullname}</p>
        <p className="text-sm text-gray-600">Original Amount: ${loan.amount}</p>
        <p className="text-sm text-gray-600">
          Remaining Balance: ${loan.remaining.toFixed(2)}
        </p>
        <p className="text-sm text-gray-600">
          Due Date: {new Date(loan.due_date).toLocaleDateString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Pay *
          </label>
          <div className="relative">
            <FiDollarSign
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="number"
              step="0.01"
              required
              className="input-field pl-10"
              value={formData.amount_paid}
              onChange={(e) =>
                setFormData({ ...formData, amount_paid: e.target.value })
              }
              placeholder="0.00"
              max={loan.remaining}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maximum: ${loan.remaining.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="relative">
            <FiCreditCard
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              className="input-field pl-10"
              value={formData.payment_method}
              onChange={(e) =>
                setFormData({ ...formData, payment_method: e.target.value })
              }
            >
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Date *
          </label>
          <div className="relative">
            <FiCalendar
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="date"
              required
              className="input-field pl-10"
              value={formData.payment_date}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            <FiSave size={20} />
            <span>{loading ? "Recording..." : "Record Payment"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/loans/${id}`)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRepayment;
