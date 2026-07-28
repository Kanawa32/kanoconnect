import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DollarSign, Save, Ruler, Weight, Zap, Repeat, Percent } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PricingSettings() {
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data } = await api.get('/pricing');
      return data.data;
    },
  });

  const [form, setForm] = useState({
    basePrice: 500, distanceRate: 100, weightRate: 50, minimumAmount: 500,
    multipliers: { standard: 1, express: 1.5, same_day: 2, scheduled: 1.2 },
  });

  useEffect(() => {
    if (pricing) {
      setForm({
        basePrice: pricing.basePrice,
        distanceRate: pricing.distanceRate,
        weightRate: pricing.weightRate,
        minimumAmount: pricing.minimumAmount || 500,
        multipliers: pricing.serviceMultipliers || { standard: 1, express: 1.5, same_day: 2, scheduled: 1.2 },
      });
    }
  }, [pricing]);

  const saveMutation = useMutation({
    mutationFn: (body) => api.put('/pricing', body),
    onSuccess: () => toast.success('Pricing updated'),
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      basePrice: Number(form.basePrice),
      distanceRate: Number(form.distanceRate),
      weightRate: Number(form.weightRate),
      minimumAmount: Number(form.minimumAmount),
      serviceMultipliers: {
        standard: Number(form.multipliers.standard),
        express: Number(form.multipliers.express),
        same_day: Number(form.multipliers.same_day),
        scheduled: Number(form.multipliers.scheduled),
      },
    });
  };

  const setAll = (field, value) => setForm({ ...form, [field]: value });
  const setMult = (key, value) => setForm({ ...form, multipliers: { ...form.multipliers, [key]: value } });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Pricing Settings</h1>
        <p className="text-surface-500 mt-1">Configure delivery pricing rates and service multipliers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base Rates */}
        <div className="card">
          <h3 className="font-bold text-surface-900 mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-accent-600" />
            Base Rates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Base Price (₦)</label>
              <input type="number" min="0" value={form.basePrice} onChange={(e) => setAll('basePrice', e.target.value)} className="input-field" />
              <p className="text-xs text-surface-400 mt-1">Flat fee per shipment</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-surface-400" /> Distance Rate (₦/km)
              </label>
              <input type="number" min="0" value={form.distanceRate} onChange={(e) => setAll('distanceRate', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5 flex items-center gap-1.5">
                <Weight className="w-3.5 h-3.5 text-surface-400" /> Weight Rate (₦/kg)
              </label>
              <input type="number" min="0" value={form.weightRate} onChange={(e) => setAll('weightRate', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-surface-100">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Minimum Amount (₦)</label>
              <input type="number" min="0" value={form.minimumAmount} onChange={(e) => setAll('minimumAmount', e.target.value)} className="input-field" />
              <p className="text-xs text-surface-400 mt-1">Minimum charge regardless of calculation</p>
            </div>
          </div>
        </div>

        {/* Service Multipliers */}
        <div className="card">
          <h3 className="font-bold text-surface-900 mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent-600" />
            Service Multipliers
          </h3>
          <p className="text-sm text-surface-500 mb-5">
            Total = (Base + Distance + Weight) × Multiplier. Values <strong className="text-accent-600">below 1</strong> discount, <strong className="text-accent-600">above 1</strong> increase price.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { key: 'standard', label: 'Standard', desc: '2-3 business days', icon: Repeat, color: 'bg-blue-50 text-blue-600' },
              { key: 'express', label: 'Express', desc: 'Next business day', icon: Zap, color: 'bg-amber-50 text-amber-600' },
              { key: 'same_day', label: 'Same Day', desc: 'Delivered today', icon: Zap, color: 'bg-orange-50 text-orange-600' },
              { key: 'scheduled', label: 'Scheduled', desc: 'Pick your date', icon: Repeat, color: 'bg-purple-50 text-purple-600' },
            ].map((s) => (
              <div key={s.key} className="p-4 bg-surface-50 rounded-xl space-y-2">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="font-semibold text-surface-900 text-sm">{s.label}</p>
                <p className="text-xs text-surface-400">{s.desc}</p>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.multipliers[s.key]}
                  onChange={(e) => setMult(s.key, e.target.value)}
                  className="input-field mt-1 text-center font-bold text-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="card-elevated p-5">
          <h3 className="font-bold text-surface-900 mb-4">Price Preview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '5km, 2kg (Standard)', dist: 5, wt: 2, type: 'standard' },
              { label: '10km, 5kg (Express)', dist: 10, wt: 5, type: 'express' },
              { label: '20km, 10kg (Same Day)', dist: 20, wt: 10, type: 'same_day' },
              { label: '50km, 20kg (Scheduled)', dist: 50, wt: 20, type: 'scheduled' },
            ].map((p, i) => {
              const distP = p.dist * Number(form.distanceRate);
              const wtP = p.wt * Number(form.weightRate);
              const mult = Number(form.multipliers[p.type]);
              const total = Math.max((Number(form.basePrice) + distP + wtP) * mult, Number(form.minimumAmount));
              return (
                <div key={i} className="p-4 bg-surface-50 rounded-xl text-sm">
                  <p className="text-surface-500 mb-1">{p.label}</p>
                  <p className="text-xl font-bold text-surface-900">₦{Math.round(total).toLocaleString()}</p>
                  <p className="text-xs text-surface-400 mt-1">₦{form.basePrice} + ₦{distP} + ₦{wtP} × {mult}x</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2 px-8">
            {saveMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4" /> Save Pricing</>}
          </button>
        </div>
      </form>
    </div>
  );
}
