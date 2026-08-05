import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle, XCircle, Clock, Search, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700' },
  paid: { label: 'Paid', class: 'bg-blue-50 text-blue-700' },
};

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/withdrawals?${params}`);
      return data;
    },
  });

  const processMutation = useMutation({
    mutationFn: ({ id, status, adminNote }) => api.patch(`/withdrawals/${id}/process`, { status, adminNote }),
    onSuccess: () => {
      toast.success('Withdrawal updated');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      setProcessingId(null);
      setAdminNote('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Withdrawal Requests</h1>
        <p className="text-surface-500 mt-1">Manage rider withdrawal requests</p>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', 'paid'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                statusFilter === s ? 'bg-accent-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
            </div>
          ) : data?.data?.length > 0 ? (
            data.data.map((w) => (
              <div key={w._id} className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-surface-900">
                        {w.rider?.firstName} {w.rider?.lastName}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold capitalize ${statusConfig[w.status]?.class || ''}`}>
                        {w.status}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-surface-900">₦{w.amount?.toLocaleString()}</p>
                    <div className="mt-2 text-xs text-surface-500 space-y-0.5">
                      <p>Bank: {w.bankDetails?.bankName} ({w.bankDetails?.bankCode || '—'}) — {w.bankDetails?.accountNumber}</p>
                      <p>Account: {w.bankDetails?.accountName}</p>
                      <p>Requested: {format(new Date(w.createdAt), 'MMM d, yyyy h:mm a')}</p>
                      {w.adminNote && <p className="text-surface-600">Note: {w.adminNote}</p>}
                      {w.transferReference && <p className="text-blue-600">Transfer Ref: {w.transferReference}</p>}
                    </div>
                  </div>

                  {w.status === 'pending' && (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <input
                        value={processingId === w._id ? adminNote : ''}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Optional note..."
                        className="input-field text-xs py-1.5"
                        onFocus={() => setProcessingId(w._id)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => processMutation.mutate({ id: w._id, status: 'approved', adminNote: processingId === w._id ? adminNote : '' })}
                          disabled={processMutation.isPending}
                          className="flex-1 bg-emerald-500 text-white rounded-lg text-xs font-semibold py-2 hover:bg-emerald-600 flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => processMutation.mutate({ id: w._id, status: 'rejected', adminNote: processingId === w._id ? adminNote : '' })}
                          disabled={processMutation.isPending}
                          className="flex-1 bg-red-500 text-white rounded-lg text-xs font-semibold py-2 hover:bg-red-600 flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-surface-400">
              <Banknote className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p className="font-medium">No {statusFilter} withdrawals</p>
            </div>
          )}
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-100">
            <p className="text-sm text-surface-500">Page {page} of {data.pagination.totalPages}</p>
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
