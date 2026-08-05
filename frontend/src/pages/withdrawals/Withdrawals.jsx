import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Banknote, ArrowUpRight, CheckCircle, XCircle, Clock, Plus, Building2, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-amber-50 text-amber-700 border border-amber-200/60', icon: Clock },
  approved: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700 border border-red-200/60', icon: XCircle },
  paid: { label: 'Paid', class: 'bg-blue-50 text-blue-700 border border-blue-200/60', icon: CheckCircle },
};

export default function Withdrawals() {
  const queryClient = useQueryClient();
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ['withdrawal-balance'],
    queryFn: async () => {
      const { data } = await api.get('/withdrawals/balance');
      return data.data;
    },
  });

  const { data: bankAccount } = useQuery({
    queryKey: ['bank-account'],
    queryFn: async () => {
      const { data } = await api.get('/withdrawals/bank-account');
      return data.data;
    },
  });

  const { data: withdrawalsData } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: async () => {
      const { data } = await api.get('/withdrawals/my');
      return data;
    },
  });

  const saveBankMutation = useMutation({
    mutationFn: (body) => api.post('/withdrawals/bank-account', body),
    onSuccess: () => {
      toast.success('Bank account saved');
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      setShowBankForm(false);
      setBankCode('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount) => api.post('/withdrawals/request', { amount }),
    onSuccess: () => {
      toast.success('Withdrawal request submitted');
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawal-balance'] });
      setWithdrawAmount('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to request withdrawal'),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Withdrawals</h1>
        <p className="text-surface-500 mt-1">Manage your earnings and withdrawals</p>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-medium">Available Balance</span>
          <Wallet className="w-5 h-5 text-white/50" />
        </div>
        <p className="text-3xl font-bold">₦{(balance?.availableBalance || 0).toLocaleString()}</p>
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/20 text-sm">
          <div>
            <span className="text-white/60">Total Earned</span>
            <p className="font-semibold">₦{(balance?.totalEarnings || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-white/60">Withdrawn</span>
            <p className="font-semibold">₦{(balance?.totalWithdrawn || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Bank Account */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-surface-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent-500" />
            Bank Account
          </h3>
          {!showBankForm && (
            <button
              onClick={() => {
                if (bankAccount) {
                  setBankName(bankAccount.bankName || '');
                  setAccountName(bankAccount.accountName || '');
                  setAccountNumber(bankAccount.accountNumber || '');
                  setBankCode(bankAccount.bankCode || '');
                }
                setShowBankForm(true);
              }}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              {bankAccount ? 'Update' : 'Add Account'}
            </button>
          )}
        </div>

        {!showBankForm && bankAccount ? (
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">{bankAccount.bankName}</p>
                <p className="font-bold text-surface-900 text-lg tracking-wider">{bankAccount.accountNumber}</p>
                <p className="text-sm text-surface-600">{bankAccount.accountName}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(bankAccount.accountNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-2 hover:bg-surface-200 rounded-lg text-surface-400 hover:text-accent-600 transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : !showBankForm ? (
          <p className="text-sm text-surface-400">No bank account set. Add one to withdraw earnings.</p>
        ) : null}

          {showBankForm && (
            <div className="space-y-3">
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name (e.g. GTBank)" className="input-field" />
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account Name" className="input-field" />
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number" className="input-field" maxLength={10} />
              <div>
                <input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="Bank Code (e.g. 058)" className="input-field" />
                <p className="text-xs text-surface-400 mt-1">Find your bank code: <a href="https://paystack.com/ng/bank-codes" target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:underline">Paystack bank codes</a></p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveBankMutation.mutate({ bankName, accountName, accountNumber, bankCode })} disabled={saveBankMutation.isPending || !bankName || !accountName || !accountNumber || !bankCode} className="btn-primary flex-1">
                  {saveBankMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setShowBankForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          )}
      </div>

      {/* Withdraw */}
      {bankAccount && (
        <div className="card">
          <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-accent-500" />
            Request Withdrawal
          </h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount"
              className="input-field flex-1"
              min="0"
              max={balance?.availableBalance || 0}
            />
            <button
              onClick={() => setWithdrawAmount(balance?.availableBalance || '')}
              className="btn-secondary text-sm whitespace-nowrap"
            >
              Max
            </button>
          </div>
          <button
            onClick={() => withdrawMutation.mutate(Number(withdrawAmount))}
            disabled={withdrawMutation.isPending || !withdrawAmount || Number(withdrawAmount) <= 0}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
          >
            {withdrawMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
            Request Withdrawal
          </button>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="card">
        <h3 className="font-bold text-surface-900 mb-4">Withdrawal History</h3>
        {withdrawalsData?.data?.length > 0 ? (
          <div className="space-y-3">
            {withdrawalsData.data.map((w) => {
              const config = statusConfig[w.status] || statusConfig.pending;
              return (
                <div key={w._id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-200 flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-surface-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">₦{w.amount?.toLocaleString()}</p>
                      <p className="text-xs text-surface-500">{format(new Date(w.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${config.class}`}>
                    <config.icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-surface-400">
            <Banknote className="w-10 h-10 mx-auto mb-2 text-surface-300" />
            <p className="font-medium">No withdrawals yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
