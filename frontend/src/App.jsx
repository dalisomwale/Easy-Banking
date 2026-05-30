import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GroupSelect from "./pages/GroupSelect";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import Layout from "./components/Layout/Layout";
import Dashboard from "./components/Dashboard/Dashboard";
import MemberList from "./components/Members/MemberList";
import InviteMember from "./components/Members/InviteMember";
import MemberForm from "./components/Members/MemberForm";
import MemberDetails from "./components/Members/MemberDetails";
import SavingForm from "./components/Savings/SavingForm";
import SavingHistory from "./components/Savings/SavingHistory";
import LoanList from "./components/Loans/LoanList";
import LoanDetails from "./components/Loans/LoanDetails";
import RepaymentForm from "./components/Loans/RepaymentForm";
import Reports from "./components/Reports/Reports";
import LoanRequestForm from "./components/Loans/LoanRequestForm";
import PendingLoans from "./components/Loans/PendingLoans"; // NEW
import AllSavings from "./components/Savings/AllSavings";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/group-select"
          element={
            <PrivateRoute>
              <GroupSelect />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-group"
          element={
            <PrivateRoute>
              <CreateGroup />
            </PrivateRoute>
          }
        />
        <Route
          path="/join-group"
          element={
            <PrivateRoute>
              <JoinGroup />
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="members" element={<MemberList />} />
          <Route path="members/add" element={<InviteMember />} />
          <Route path="members/edit/:id" element={<MemberForm />} />
          <Route path="members/:id" element={<MemberDetails />} />
          <Route path="savings/add" element={<SavingForm />} />
          <Route path="savings/history/:memberId" element={<SavingHistory />} />
          <Route path="loans" element={<LoanList />} />
          <Route path="loans/pending" element={<PendingLoans />} /> {/* NEW */}
          <Route path="loans/:id" element={<LoanDetails />} />
          <Route path="loans/request" element={<LoanRequestForm />} />
          <Route path="loans/:id/repayment" element={<RepaymentForm />} />
          <Route path="reports" element={<Reports />} />
          <Route path="savings/all" element={<AllSavings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
