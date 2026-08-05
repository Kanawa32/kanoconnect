import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Shipments
import ShipmentList from './pages/shipments/ShipmentList';
import ShipmentDetail from './pages/shipments/ShipmentDetail';
import CreateShipment from './pages/shipments/CreateShipment';
import AvailableOrders from './pages/shipments/AvailableOrders';
import TrackShipment from './pages/tracking/TrackShipment';

// Fleet
import VehicleList from './pages/fleet/VehicleList';
import FleetList from './pages/fleet/FleetList';

// Reports
import Reports from './pages/reports/Reports';

// Withdrawals
import Withdrawals from './pages/withdrawals/Withdrawals';
import AdminWithdrawals from './pages/withdrawals/AdminWithdrawals';

// Users
import UserList from './pages/dashboard/UserList';

// Drivers
import Drivers from './pages/drivers/Drivers';

// Payments
import PaymentSettings from './pages/payments/PaymentSettings';
import PricingSettings from './pages/payments/PricingSettings';

function App() {
  const { initializeAuth } = useAuthStore();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/track/:trackingNumber?" element={<TrackShipment />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/shipments/create" element={<CreateShipment />} />
          <Route path="/orders/available" element={<AvailableOrders />} />
          <Route path="/shipments/:id" element={<ShipmentDetail />} />

          <Route path="/fleet/vehicles" element={<VehicleList />} />
          <Route path="/fleet/fleets" element={<FleetList />} />

          <Route path="/reports" element={<Reports />} />
          <Route path="/withdrawals" element={<Withdrawals />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/payments/settings" element={<PaymentSettings />} />
          <Route path="/pricing" element={<PricingSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
