import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, Package, DollarSign, Users, FileText } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('revenue');
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef(null);

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

  const totalRevenue = revenueData?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const totalShipments = shipmentData?.byStatus ? Object.values(shipmentData.byStatus).reduce((a, b) => a + b, 0) : 0;
  const totalDelivered = shipmentData?.byStatus?.delivered || 0;
  const totalPending = shipmentData?.byStatus?.pending || 0;
  const totalPaidToDrivers = revenueData?.reduce((sum, d) => sum + (d.riderPayout || 0), 0) || 0;
  const netProfit = totalRevenue - totalPaidToDrivers;

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 190;
      let y = 20;

      const addHeader = () => {
        pdf.setFontSize(18);
        pdf.setTextColor(37, 99, 235);
        pdf.text('KanoConnect', pageW / 2, y, { align: 'center' });
        y += 8;
        pdf.setFontSize(12);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Report: ${startDate} to ${endDate}`, pageW / 2, y, { align: 'center' });
        y += 12;
      };

      addHeader();

      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Financial Summary', 14, y);
      y += 8;

      pdf.autoTable({
        startY: y,
        theme: 'grid',
        head: [['Metric', 'Amount (NGN)']],
        body: [
          ['Total Revenue', `₦${totalRevenue.toLocaleString()}`],
          ['Paid to Drivers', `₦${totalPaidToDrivers.toLocaleString()}`],
          ['Net Profit', `₦${netProfit.toLocaleString()}`],
        ],
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 70, halign: 'right' } },
      });

      y = pdf.lastAutoTable.finalY + 12;

      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Shipment Summary', 14, y);
      y += 8;

      pdf.autoTable({
        startY: y,
        theme: 'grid',
        head: [['Status', 'Count']],
        body: [
          ['Total Shipments', totalShipments.toString()],
          ['Delivered', totalDelivered.toString()],
          ['Pending', totalPending.toString()],
          ['Delivery Rate', totalShipments > 0 ? `${((totalDelivered / totalShipments) * 100).toFixed(1)}%` : '0%'],
        ],
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 70, halign: 'right' } },
      });

      y = pdf.lastAutoTable.finalY + 12;

      const charts = reportRef.current?.querySelectorAll('.chart-container');
      if (charts) {
        for (const chart of charts) {
          if (y > 250) { pdf.addPage(); y = 20; addHeader(); }
          try {
            const canvas = await html2canvas(chart, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const imgW = pageW;
            const imgH = (canvas.height / canvas.width) * imgW;
            if (imgH > 200) {
              pdf.addImage(imgData, 'PNG', 10, y, pageW, 100);
              y += 110;
            } else {
              pdf.addImage(imgData, 'PNG', 10, y, pageW, imgH);
              y += imgH + 10;
            }
          } catch { /* skip chart if capture fails */ }
        }
      }

      if (shipmentData?.dailyStats?.length) {
        if (y > 220) { pdf.addPage(); y = 20; addHeader(); }
        y += 4;
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Daily Activity', 14, y);
        y += 8;

        pdf.autoTable({
          startY: y,
          theme: 'grid',
          head: [['Date', 'Created', 'Delivered', 'Rate']],
          body: shipmentData.dailyStats.map((d) => [
            d._id,
            d.created.toString(),
            d.delivered.toString(),
            d.created > 0 ? `${((d.delivered / d.created) * 100).toFixed(1)}%` : '0%',
          ]),
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        });
      }

      const dateStr = format(new Date(), 'yyyyMMdd-HHmmss');
      pdf.save(`kanoconnect-report-${dateStr}.pdf`);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('PDF export failed');
    }
    setExportingPdf(false);
  };

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
          <button
            onClick={exportPdf}
            disabled={exportingPdf}
            className="btn-primary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {exportingPdf ? 'Generating...' : 'PDF Report'}
          </button>
          <button
            onClick={async () => {
              try {
                const res = await api.get(`/reports/export?startDate=${startDate}&endDate=${endDate}&type=${reportType}`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${reportType}-${startDate}-${endDate}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                toast.error('Export failed');
              }
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">₦{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid to Drivers</p>
              <p className="text-2xl font-bold text-violet-600">₦{totalPaidToDrivers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-violet-100 rounded-lg">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">₦{netProfit.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900">{totalShipments}</p>
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
              <p className="text-2xl font-bold text-gray-900">{totalDelivered}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card chart-container">
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
