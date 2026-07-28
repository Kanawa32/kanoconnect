import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Phone, Mail, Star, Navigation, Package, Shield, MoreHorizontal, Eye, EyeOff, Truck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Drivers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [onlineFilter, setOnlineFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['riders', page, search, onlineFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (onlineFilter) params.append('isOnline', onlineFilter);
      const { data } = await api.get(`/users/riders?${params}`);
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/users/${id}`, { isActive: !isActive }),
    onSuccess: () => {
      toast.success('Driver status updated');
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Drivers</h1>
        <p className="text-surface-500 mt-1">Manage your delivery riders</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-accent-500 transition-colors" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={onlineFilter}
            onChange={(e) => { setOnlineFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-44"
          >
            <option value="">All Drivers</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
            </div>
          ) : data?.data?.length > 0 ? (
            data.data.map((rider, index) => (
              <div key={rider._id} className="relative group">
                <div className="card animate-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {rider.firstName[0]}{rider.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-surface-900">{rider.firstName} {rider.lastName}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold text-surface-600">{rider.riderProfile?.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-xs text-surface-400">• {rider.riderProfile?.totalDeliveries || 0} deliveries</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      rider.riderProfile?.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-100 text-surface-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rider.riderProfile?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-surface-400'}`} />
                      {rider.riderProfile?.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5 text-surface-600">
                      <Phone className="w-4 h-4 text-surface-400" />
                      <span>{rider.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-surface-600">
                      <Mail className="w-4 h-4 text-surface-400" />
                      <span className="truncate">{rider.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-surface-600">
                      <Truck className="w-4 h-4 text-surface-400" />
                      <span>{rider.riderProfile?.vehicleAssigned ? 'Vehicle assigned' : 'No vehicle'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-surface-100">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: rider._id, isActive: rider.isActive })}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        rider.isActive !== false
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {rider.isActive !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {rider.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="flex-1 py-2 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-surface-400">
              <User className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p className="font-semibold text-surface-500">No drivers found</p>
              <p className="text-sm mt-1">Drivers will appear here once they register</p>
            </div>
          )}
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, data.pagination.total)} of {data.pagination.total} drivers
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
