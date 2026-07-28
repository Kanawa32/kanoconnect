import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Package, MapPin, ArrowRight, Truck } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  picked_up: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  in_transit: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  at_hub: 'bg-cyan-50 text-cyan-700 border border-cyan-200/60',
  out_for_delivery: 'bg-orange-50 text-orange-700 border border-orange-200/60',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-700 border border-red-200/60',
};

export default function ShipmentList() {
  const { user } = useAuthStore();
  const isRider = user?.role === 'rider';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/shipments?${params}`);
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{isRider ? 'My Orders' : 'Orders'}</h1>
          <p className="text-surface-500 mt-1">{isRider ? 'Orders assigned to you' : 'Manage and track all orders'}</p>
        </div>
        <div className="flex gap-3">
          {isRider && (
            <Link to="/orders/available" className="btn-primary flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Available Orders
            </Link>
          )}
          {!isRider && (
            <Link to="/shipments/create" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Order
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-accent-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by tracking number or address..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left table-header py-3 px-2">Tracking #</th>
                <th className="text-left table-header py-3 px-2">Route</th>
                <th className="text-left table-header py-3 px-2">Items</th>
                <th className="text-left table-header py-3 px-2">Rider</th>
                <th className="text-left table-header py-3 px-2">Status</th>
                <th className="text-left table-header py-3 px-2">Amount</th>
                <th className="text-left table-header py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : data?.data?.map((shipment) => (
                <tr key={shipment._id} className="table-row">
                  <td className="py-3 px-2">
                    <Link to={`/shipments/${shipment._id}`} className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-accent-500" />
                      <span className="text-sm font-semibold text-accent-600 hover:text-accent-700 transition-colors">{shipment.trackingNumber}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-surface-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span className="truncate max-w-[120px]">{shipment.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ArrowRight className="w-3 h-3 text-surface-400" />
                        <span className="truncate max-w-[120px]">{shipment.deliveryAddress}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-600">{shipment.items?.length || 0} items</td>
                  <td className="py-3 px-2 text-sm text-surface-700">
                    {shipment.rider ? `${shipment.rider.firstName} ${shipment.rider.lastName}` : '—'}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${statusColors[shipment.status] || 'bg-surface-50 text-surface-700'}`}>
                      {shipment.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm font-bold text-surface-900">₦{shipment.totalAmount?.toLocaleString()}</td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    {format(new Date(shipment.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              )) || (
                <tr><td colSpan={7} className="py-12 text-center text-surface-400">
                  <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                  <p className="font-medium">No orders found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Page {page} of {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages} className="btn-secondary py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
