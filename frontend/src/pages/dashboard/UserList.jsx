import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MoreHorizontal, Package } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const roleColors = {
  customer: 'bg-surface-50 text-surface-700 border border-surface-200/60',
  rider: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  dispatcher: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  admin: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  super_admin: 'bg-red-50 text-red-700 border border-red-200/60',
};

export default function UserList() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'customer' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const { data } = await api.get(`/users?${params}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/users', payload),
    onSuccess: () => {
      toast.success('User created');
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'customer' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Failed to create user';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Users</h1>
          <p className="text-surface-500 mt-1">Manage system users</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left table-header py-3 px-2">User</th>
                <th className="text-left table-header py-3 px-2">Role</th>
                <th className="text-left table-header py-3 px-2">Phone</th>
                <th className="text-left table-header py-3 px-2">Status</th>
                <th className="text-left table-header py-3 px-2">Joined</th>
                <th className="text-left table-header py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : data?.data?.map((user) => (
                <tr key={user._id} className="table-row">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-surface-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-surface-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${roleColors[user.role] || 'bg-surface-50 text-surface-700'}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-600">{user.phone}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-surface-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2">
                    <button className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-surface-500" />
                    </button>
                  </td>
                </tr>
              )) || (
                <tr><td colSpan={6} className="py-12 text-center text-surface-400">
                  <Package className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                  <p className="font-medium">No users found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.pagination.total)} of {data.pagination.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="btn-secondary py-1.5 px-3"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add User">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" placeholder="First name" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" placeholder="Last name" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="user@example.com" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="080..." required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Min 6 chars" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="customer">Customer</option>
              <option value="rider">Rider</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
