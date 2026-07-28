import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Users, Truck, MapPin, Package } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export default function FleetList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', region: { city: '', state: '', country: 'Nigeria' } });

  const { data, isLoading } = useQuery({
    queryKey: ['fleets', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/fleets?${params}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/fleets', payload),
    onSuccess: () => {
      toast.success('Fleet created');
      setShowModal(false);
      setForm({ name: '', description: '', region: { city: '', state: '', country: 'Nigeria' } });
      queryClient.invalidateQueries({ queryKey: ['fleets'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Failed to create fleet';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Fleets</h1>
          <p className="text-surface-500 mt-1">Manage fleet groups and regions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Fleet
        </button>
      </div>

      <div className="card">
        <div className="relative mb-6 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-accent-500 transition-colors" />
          <input
            type="text"
            placeholder="Search fleets..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : data?.data?.length > 0 ? (
            data.data.map((fleet) => (
              <div key={fleet._id} className="card group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-surface-900 text-lg">{fleet.name}</h3>
                    <p className="text-sm text-surface-500 mt-1">{fleet.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-surface-600">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-surface-400" />
                        {fleet.region?.city}, {fleet.region?.state}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-surface-400" />
                        {fleet.vehicles?.length || 0} vehicles
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-surface-400" />
                        {fleet.riders?.length || 0} riders
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                    fleet.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-surface-50 text-surface-700 border border-surface-200/60'
                  }`}>
                    {fleet.status}
                  </span>
                </div>
                {fleet.manager && (
                  <div className="mt-3 pt-3 border-t border-surface-100 flex items-center gap-2 text-sm text-surface-600">
                    <span className="text-surface-400">Manager:</span>
                    <span className="font-semibold text-surface-700">{fleet.manager.firstName} {fleet.manager.lastName}</span>
                    <span className="text-surface-400">• {fleet.manager.email}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-surface-400">
              <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
              <p className="font-medium">No fleets found</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Fleet">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Fleet Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Kano City Fleet" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Describe this fleet..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">City</label>
              <input value={form.region.city} onChange={(e) => setForm({ ...form, region: { ...form.region, city: e.target.value } })} className="input-field" placeholder="e.g. Kano" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">State</label>
              <input value={form.region.state} onChange={(e) => setForm({ ...form, region: { ...form.region, state: e.target.value } })} className="input-field" placeholder="e.g. Kano State" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Fleet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
