import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, Truck, Users, DollarSign, 
  TrendingUp, Clock, MapPin, ArrowUpRight,
  CheckCircle, PackageCheck, Navigation, ArrowUpRight as ArrowUp
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, color, index }) => (
  <div className="stat-card animate-in" style={{ animationDelay: `${index * 0.05}s` }}>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-surface-500">{title}</p>
        <h3 className="text-2xl font-bold text-surface-900 tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600">{trend}</span>
            </div>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    picked_up: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    in_transit: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    at_hub: 'bg-cyan-50 text-cyan-700 border border-cyan-200/60',
    out_for_delivery: 'bg-orange-50 text-orange-700 border border-orange-200/60',
    delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    cancelled: 'bg-red-50 text-red-700 border border-red-200/60',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${colors[status] || 'bg-surface-50 text-surface-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

function RiderDashboard({ stats }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Rider Dashboard</h1>
        <p className="text-surface-500 mt-1">Your delivery overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Deliveries"
          value={stats?.activeDeliveries?.toLocaleString() || 0}
          icon={Navigation}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          index={0}
        />
        <StatCard
          title="Pending Pickups"
          value={stats?.pendingDeliveries?.toLocaleString() || 0}
          icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          index={1}
        />
        <StatCard
          title="Completed"
          value={stats?.completedDeliveries?.toLocaleString() || 0}
          icon={CheckCircle}
          color="bg-gradient-to-br from-emerald-500 to-green-500"
          index={2}
        />
        <StatCard
          title="Total Earnings"
          value={`₦${(stats?.totalEarnings || 0).toLocaleString()}`}
          icon={DollarSign}
          trend="+12% this month"
          color="bg-gradient-to-br from-primary-600 to-accent-600"
          index={3}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-surface-900">Your Assignments</h2>
          <Link to="/shipments" className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left table-header py-3 px-2">Tracking #</th>
                <th className="text-left table-header py-3 px-2">Customer</th>
                <th className="text-left table-header py-3 px-2">Route</th>
                <th className="text-left table-header py-3 px-2">Status</th>
                <th className="text-left table-header py-3 px-2">Amount</th>
                <th className="text-left table-header py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {stats?.recentShipments?.map((shipment) => (
                <tr key={shipment._id} className="table-row">
                  <td className="py-3 px-2">
                    <Link to={`/shipments/${shipment._id}`} className="text-sm font-semibold text-accent-600 hover:text-accent-700 transition-colors">
                      {shipment.trackingNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-700">
                    {shipment.customer?.firstName} {shipment.customer?.lastName}
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    <div className="flex items-center gap-1 max-w-[200px]">
                      <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{shipment.pickupAddress}</span>
                      <span className="text-surface-300 mx-1">→</span>
                      <span className="truncate">{shipment.deliveryAddress}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="py-3 px-2 text-sm font-bold text-surface-900">
                    ₦{shipment.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    {format(new Date(shipment.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                    <p className="font-medium">No assignments yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CustomerDashboard({ stats }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">My Orders</h1>
        <p className="text-surface-500 mt-1">Track your deliveries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalShipments?.toLocaleString() || 0}
          icon={Package}
          color="bg-gradient-to-br from-blue-500 to-indigo-500"
          index={0}
        />
        <StatCard
          title="In Transit"
          value={stats?.activeShipments?.toLocaleString() || 0}
          icon={Truck}
          color="bg-gradient-to-br from-purple-500 to-violet-500"
          index={1}
        />
        <StatCard
          title="Delivered"
          value={stats?.deliveredShipments?.toLocaleString() || 0}
          icon={PackageCheck}
          color="bg-gradient-to-br from-emerald-500 to-green-500"
          index={2}
        />
        <StatCard
          title="Total Spent"
          value={`₦${(stats?.totalSpent || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-gradient-to-br from-primary-600 to-accent-600"
          index={3}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-surface-900">Recent Orders</h2>
          <div className="flex gap-3">
            <Link to="/shipments/create" className="btn-primary text-sm py-2">
              New Order
            </Link>
            <Link to="/shipments" className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left table-header py-3 px-2">Tracking #</th>
                <th className="text-left table-header py-3 px-2">Route</th>
                <th className="text-left table-header py-3 px-2">Status</th>
                <th className="text-left table-header py-3 px-2">Amount</th>
                <th className="text-left table-header py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {stats?.recentShipments?.map((shipment) => (
                <tr key={shipment._id} className="table-row">
                  <td className="py-3 px-2">
                    <Link to={`/shipments/${shipment._id}`} className="text-sm font-semibold text-accent-600 hover:text-accent-700 transition-colors">
                      {shipment.trackingNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    <div className="flex items-center gap-1 max-w-[200px]">
                      <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{shipment.pickupAddress}</span>
                      <span className="text-surface-300 mx-1">→</span>
                      <span className="truncate">{shipment.deliveryAddress}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="py-3 px-2 text-sm font-bold text-surface-900">
                    ₦{shipment.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    {format(new Date(shipment.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-surface-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                    <p className="font-medium">No orders yet</p>
                    <p className="text-sm mt-1">Create your first order to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ stats }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
        <p className="text-surface-500 mt-1">Overview of your logistics operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalShipments?.toLocaleString() || 0}
          icon={Package}
          trend="+12% this month"
          color="bg-gradient-to-br from-primary-600 to-primary-500"
          index={0}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingShipments?.toLocaleString() || 0}
          icon={Clock}
          color="bg-gradient-to-br from-accent-600 to-accent-500"
          index={1}
        />
        <StatCard
          title="Active Riders"
          value={stats?.activeRiders?.toLocaleString() || 0}
          icon={Truck}
          color="bg-gradient-to-br from-emerald-500 to-green-500"
          index={2}
        />
        <StatCard
          title="Total Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend="+8.5% this month"
          color="bg-gradient-to-br from-primary-600 to-accent-600"
          index={3}
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-surface-900">Recent Orders</h2>
          <Link to="/shipments" className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1 transition-colors">
            View all <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left table-header py-3 px-2">Tracking #</th>
                <th className="text-left table-header py-3 px-2">Customer</th>
                <th className="text-left table-header py-3 px-2">Route</th>
                <th className="text-left table-header py-3 px-2">Status</th>
                <th className="text-left table-header py-3 px-2">Amount</th>
                <th className="text-left table-header py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {stats?.recentShipments?.map((shipment) => (
                <tr key={shipment._id} className="table-row">
                  <td className="py-3 px-2">
                    <Link to={`/shipments/${shipment._id}`} className="text-sm font-semibold text-accent-600 hover:text-accent-700 transition-colors">
                      {shipment.trackingNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-700">
                    {shipment.customer?.firstName} {shipment.customer?.lastName}
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    <div className="flex items-center gap-1 max-w-[200px]">
                      <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{shipment.pickupAddress}</span>
                      <span className="text-surface-300 mx-1">→</span>
                      <span className="truncate">{shipment.deliveryAddress}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="py-3 px-2 text-sm font-bold text-surface-900">
                    ₦{shipment.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    {format(new Date(shipment.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-surface-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                    <p className="font-medium">No recent orders</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      const { data } = await api.get('/users/dashboard-stats');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'rider') return <RiderDashboard stats={stats} />;
  if (user?.role === 'customer') return <CustomerDashboard stats={stats} />;
  return <AdminDashboard stats={stats} />;
}
