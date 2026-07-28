import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import api from '../../services/api';
import { format, subDays } from 'date-fns';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('revenue');

  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd');

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-report', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/reports/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=day`);
      return data.data.revenue;
    },
  });

  const { data: shipmentData } = useQuery({
    queryKey: ['shipment-report', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/reports/shipments?startDate=${startDate}&endDate=${endDate}`);
      return data.data;
    },
  });

  const statusData = shipmentData?.byStatus ? Object.entries(shipmentData.byStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value })) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Insights into your logistics operations</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-40"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₦{revenueData?.reduce((sum, d) => sum + d.revenue, 0).toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipmentData?.byStatus ? Object.values(shipmentData.byStatus).reduce((a, b) => a + b, 0) : 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{shipmentData?.byStatus?.delivered || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{shipmentData?.byStatus?.pending || 0}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => `₦${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Shipment Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-gray-600 capitalize">{entry.name}</span>
                <span className="text-gray-400">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Stats Table */}
      {shipmentData?.dailyStats && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Created</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Delivered</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Delivery Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shipmentData.dailyStats.map((day) => (
                  <tr key={day._id}>
                    <td className="py-3 text-sm">{day._id}</td>
                    <td className="py-3 text-sm">{day.created}</td>
                    <td className="py-3 text-sm">{day.delivered}</td>
                    <td className="py-3 text-sm">
                      <span className={`font-medium ${day.created > 0 && (day.delivered / day.created) >= 0.8 ? 'text-green-600' : 'text-amber-600'}`}>
                        {day.created > 0 ? ((day.delivered / day.created) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
