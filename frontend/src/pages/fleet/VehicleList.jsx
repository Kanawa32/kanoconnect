import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Wrench, Package } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  maintenance: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  inactive: 'bg-surface-50 text-surface-700 border border-surface-200/60',
  retired: 'bg-red-50 text-red-700 border border-red-200/60',
};

const typeIcons = {
  motorcycle: '🏍️',
  bicycle: '🚲',
  car: '🚗',
  van: '🚐',
  truck: '🚛',
  pickup: '🛻',
  bus: '🚌',
};

export default function VehicleList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', registrationNumber: '', type: 'car', brand: '', model: '', year: '', capacity: { weight: '', volume: '' }, color: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/vehicles?${params}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/vehicles', payload),
    onSuccess: () => {
      toast.success('Vehicle added');
      setShowModal(false);
      setForm({ name: '', registrationNumber: '', type: 'car', brand: '', model: '', year: '', capacity: { weight: '', volume: '' }, color: '' });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Failed to add vehicle';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Vehicles</h1>
          <p className="text-surface-500 mt-1">Manage your fleet vehicles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-accent-500 transition-colors" />
            <input
              type="text"
              placeholder="Search vehicles..."
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
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : data?.data?.map((vehicle) => (
            <div key={vehicle._id} className="card group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcons[vehicle.type] || '🚗'}</span>
                  <div>
                    <h3 className="font-semibold text-surface-900">{vehicle.name}</h3>
                    <p className="text-sm text-surface-500">{vehicle.registrationNumber}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${statusColors[vehicle.status] || 'bg-surface-50 text-surface-700'}`}>
                  {vehicle.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-500">Type</span>
                  <span className="font-medium capitalize text-surface-700">{vehicle.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Brand</span>
                  <span className="font-medium text-surface-700">{vehicle.brand} {vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Capacity</span>
                  <span className="font-medium text-surface-700">{vehicle.capacity?.weight}kg</span>
                </div>
                {vehicle.assignedRider && (
                  <div className="flex justify-between">
                    <span className="text-surface-500">Rider</span>
                    <span className="font-medium text-surface-700">{vehicle.assignedRider.firstName} {vehicle.assignedRider.lastName}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-surface-100">
                <button className="flex-1 py-1.5 text-xs font-semibold text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors">
                  Edit
                </button>
                <button className="flex-1 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                  <Wrench className="w-3 h-3" />
                  Maintenance
                </button>
              </div>
            </div>
          )) || (
            <div className="col-span-full text-center py-12 text-surface-400">
              <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
              <p className="font-medium">No vehicles found</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Vehicle">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Vehicle Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Toyota Hiace" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Registration No.</label>
              <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="input-field" placeholder="e.g. ABC-123-XY" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="motorcycle">Motorcycle</option>
                <option value="bicycle">Bicycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
                <option value="pickup">Pickup</option>
                <option value="bus">Bus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Color</label>
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input-field" placeholder="e.g. White" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" placeholder="e.g. Toyota" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Model</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input-field" placeholder="e.g. Hiace" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Weight Capacity (kg)</label>
              <input type="number" value={form.capacity.weight} onChange={(e) => setForm({ ...form, capacity: { ...form.capacity, weight: e.target.value } })} className="input-field" placeholder="e.g. 1000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input-field" placeholder="e.g. 2024" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
