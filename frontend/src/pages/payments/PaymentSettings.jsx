import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Building2, CreditCard, Save, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PaymentSettings() {
  const [form, setForm] = useState({ bankName: '', accountName: '', accountNumber: '', sortCode: '' });

  const { data: currentAccount, isLoading } = useQuery({
    queryKey: ['payment-account'],
    queryFn: async () => {
      const { data } = await api.get('/payment-accounts/active');
      return data.data;
    },
  });

  useEffect(() => {
    if (currentAccount) {
      setForm({ bankName: currentAccount.bankName, accountName: currentAccount.accountName, accountNumber: currentAccount.accountNumber, sortCode: currentAccount.sortCode || '' });
    }
  }, [currentAccount]);

  const saveMutation = useMutation({
    mutationFn: (body) => api.post('/payment-accounts', body),
    onSuccess: () => { toast.success('Payment account saved'); },
    onError: (err) => { toast.error(err.response?.data?.message || 'Save failed'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bankName || !form.accountName || !form.accountNumber) {
      toast.error('Bank name, account name, and account number are required');
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Payment Settings</h1>
        <p className="text-surface-500 mt-1">Manage the receiving bank account for bank transfer payments</p>
      </div>

      {currentAccount && (
        <div className="card-elevated p-5">
          <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-accent-600" />
            Current Active Account
          </h3>
          <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-surface-900 text-lg">{currentAccount.accountName}</p>
              <p className="text-surface-600">{currentAccount.bankName}</p>
              <p className="text-sm font-mono text-surface-800 mt-0.5">
                <span className="font-bold tracking-wider">{currentAccount.accountNumber}</span>
                {currentAccount.sortCode && <span className="text-surface-400 ml-3">Sort: {currentAccount.sortCode}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <h3 className="font-semibold text-surface-900 flex items-center gap-2">
          <Save className="w-5 h-5 text-accent-600" />
          {currentAccount ? 'Update Bank Account' : 'Set Bank Account'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Bank Name</label>
            <input
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              className="input-field"
              placeholder="e.g. GTBank, Access Bank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Account Name</label>
            <input
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              className="input-field"
              placeholder="e.g. Kano Connect Ltd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Account Number</label>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className="input-field"
              placeholder="10-digit account number"
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Sort Code (optional)</label>
            <input
              value={form.sortCode}
              onChange={(e) => setForm({ ...form, sortCode: e.target.value })}
              className="input-field"
              placeholder="e.g. 012345678"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
