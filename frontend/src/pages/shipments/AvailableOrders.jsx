import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Package, MapPin, ArrowRight, Clock, DollarSign, ArrowLeft, Zap } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AvailableOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['available-orders', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      const { data } = await api.get(`/shipments/available?${params}`);
      return data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.patch(`/shipments/${id}/accept`),
    onSuccess: (response) => {
      toast.success('Order accepted!');
      queryClient.invalidateQueries({ queryKey: ['available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate(`/shipments/${response.data.data._id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept order');
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-xl text-surface-500 hover:text-surface-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Available Orders</h1>
          <p className="text-surface-500 mt-1">Accept orders to start delivering</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
          </div>
        ) : data?.data?.length > 0 ? (
          data.data.map((order, index) => (
            <div key={order._id} className="card group animate-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <Link to={`/shipments/${order._id}`} className="text-sm font-bold text-accent-600 hover:text-accent-700 transition-colors">
                      {order.trackingNumber}
                    </Link>
                    <span className="badge-warning">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-surface-600">
                      <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{order.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-surface-600">
                      <ArrowRight className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span className="truncate">{order.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-surface-600">
                      <Clock className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span>{format(new Date(order.pickupDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-surface-500">
                      Items: <strong className="text-surface-700">{order.items?.length || 0}</strong>
                    </span>
                    <span className="text-surface-500">
                      Weight: <strong className="text-surface-700">{order.totalWeight || 0}kg</strong>
                    </span>
                    {order.customer && (
                      <span className="text-surface-500">
                        Customer: <strong className="text-surface-700">{order.customer.firstName} {order.customer.lastName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-1 text-xl font-bold text-surface-900">
                    <DollarSign className="w-5 h-5 text-accent-500" />
                    ₦{order.totalAmount?.toLocaleString()}
                  </div>
                  <button
                    onClick={() => acceptMutation.mutate(order._id)}
                    disabled={acceptMutation.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {acceptMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Accept Order
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-surface-400" />
            </div>
            <p className="text-surface-600 font-semibold text-lg">No available orders</p>
            <p className="text-surface-400 text-sm mt-1">Check back later for new orders</p>
          </div>
        )}
      </div>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
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
  );
}
