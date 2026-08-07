import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { 
  FiCalendar, FiBarChart2, FiUsers, FiDisc, FiTrendingUp, 
  FiFileText, FiShield, FiAlertTriangle, FiCheck, FiTruck, FiRefreshCw
} from 'react-icons/fi';

const Reports = () => {
  // Report Tab: 'daily' | 'customers' | 'cans' | 'inventory'
  const [activeReport, setActiveReport] = useState('daily');
  
  // Date parameter for daily report (YYYY-MM-DD)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // States
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      let data = null;
      
      if (activeReport === 'daily') {
        data = await reportService.getDaily(reportDate);
      } else if (activeReport === 'customers') {
        data = await reportService.getCustomers();
      } else if (activeReport === 'cans') {
        data = await reportService.getCans();
      } else {
        data = await reportService.getInventory();
      }
      
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch the requested report metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, reportDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Reports & Analytics</h1>
        <p className="text-slate-400 font-medium text-sm">Review financial audits, inventory distribution levels, and customer debt reports.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-max">
        {[
          { label: 'Daily Summary', val: 'daily', icon: FiCalendar },
          { label: 'Customer Balances', val: 'customers', icon: FiUsers },
          { label: 'Can Usage Metrics', val: 'cans', icon: FiDisc },
          { label: 'Inventory Reconciliation', val: 'inventory', icon: FiShield }
        ].map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button
              key={idx}
              onClick={() => setActiveReport(tab.val)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeReport === tab.val
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date picker row for Daily Report */}
      {activeReport === 'daily' && (
        <div className="flex items-center gap-3 bg-white p-4 border border-slate-100 shadow-premium rounded-2xl w-max">
          <span className="text-xs font-bold text-slate-500 uppercase">Select Audit Date:</span>
          <div className="relative">
            <input 
              type="date" 
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:border-primary-500 outline-none font-sans text-slate-700"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-2">
          <FiAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Report Content Body */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400 font-medium shadow-premium">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Compiling report analysis...
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* 1. DAILY REPORT VIEW */}
          {activeReport === 'daily' && (
            <div className="space-y-6">
              {/* Daily Financial summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 shadow-premium p-5 rounded-2xl">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Water Billings</span>
                  <span className="text-2xl font-extrabold text-slate-800 block mt-1 font-display">₹{reportData.waterRevenue}</span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Billed for delivered cans</span>
                </div>
                <div className="bg-white border border-slate-100 shadow-premium p-5 rounded-2xl">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Pending Debts</span>
                  <span className="text-2xl font-extrabold text-red-500 block mt-1 font-display">₹{reportData.pendingPayments}</span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Unpaid charges from today</span>
                </div>
                <div className="bg-white border border-slate-100 shadow-premium p-5 rounded-2xl">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Security Deposits</span>
                  <span className="text-2xl font-extrabold text-indigo-600 block mt-1 font-display">₹{reportData.deposits}</span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Collected security deposits</span>
                </div>
                <div className="bg-white border border-slate-100 shadow-premium p-5 rounded-2xl">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Deposits Refunded</span>
                  <span className="text-2xl font-extrabold text-cyan-600 block mt-1 font-display">₹{reportData.refunds}</span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">Cash refunds on return</span>
                </div>
              </div>

              {/* Delivery stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 shadow-premium p-5 rounded-2xl md:col-span-2 flex items-center justify-around">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deliveries</span>
                    <span className="text-3xl font-extrabold text-primary-600 block mt-2 font-display flex items-center justify-center gap-1.5">
                      <FiTruck size={24} />
                      {reportData.deliveries} Cans
                    </span>
                  </div>
                  <div className="w-px h-16 bg-slate-100" />
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Returns</span>
                    <span className="text-3xl font-extrabold text-purple-600 block mt-2 font-display flex items-center justify-center gap-1.5">
                      <FiRefreshCw size={24} className="animate-spin-slow" />
                      {reportData.returns} Cans
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-premium p-5 rounded-2xl flex flex-col justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cans Currently with Customers</span>
                  <span className="text-3xl font-extrabold text-slate-800 block mt-2 font-display">
                    {reportData.outstandingCans} Cans
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. CUSTOMER REPORT VIEW */}
          {activeReport === 'customers' && (
            <div className="bg-white border border-slate-100 shadow-premium rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm font-medium">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Customer Profile</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Type</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase text-center">Cans Held</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Outstanding Due</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...reportData.fixedCustomers, ...reportData.localCustomers].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-700">{item.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-medium">{item.phone}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'Fixed' ? 'bg-blue-50 text-primary-700' : 'bg-cyan-50 text-accent-700'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-mono font-bold text-slate-800">
                          {item.canBalance}
                        </td>
                        <td className={`px-5 py-4 font-bold ${item.pendingAmount > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                          ₹{item.pendingAmount}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          ₹{item.totalPaid}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CAN REPORT VIEW */}
          {activeReport === 'cans' && (
            <div className="bg-white border border-slate-100 shadow-premium rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm font-medium">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Can Name / Code</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase text-center">Deliveries</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase text-center">Returns</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Last Transacted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map((can, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-700">{can.canName}</div>
                          <div className="text-xs font-bold font-mono text-primary-600 mt-0.5">{can.canId}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            can.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                            can.status.includes('Fixed') ? 'bg-blue-50 text-blue-700' :
                            can.status.includes('Local') ? 'bg-cyan-50 text-accent-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {can.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-700 font-mono">
                          {can.deliveryCount}
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-slate-700 font-mono">
                          {can.returnCount}
                        </td>
                        <td className="px-5 py-4 text-slate-400 font-medium text-xs">
                          {new Date(can.lastUpdated || can.updatedAt).toLocaleDateString()} at {new Date(can.lastUpdated || can.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. INVENTORY RECONCILIATION */}
          {activeReport === 'inventory' && (
            <div className="space-y-6">
              {/* Reconciliation status summary */}
              <div className="bg-white border border-slate-100 shadow-premium p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    reportData.isMismatch ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {reportData.isMismatch ? <FiAlertTriangle size={24} /> : <FiCheck size={24} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base font-display">System Inventory Integrity</h3>
                    <p className={`text-xs mt-1 font-semibold ${
                      reportData.isMismatch ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                      {reportData.validationMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status details grid */}
              <div className="bg-white border border-slate-100 shadow-premium p-6 rounded-2xl space-y-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none">Status Audit Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm font-medium">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">In stock (Available)</span>
                    <span className="text-2xl font-extrabold block text-slate-800 font-display font-mono mt-1">{reportData.available}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">With Fixed accounts</span>
                    <span className="text-2xl font-extrabold block text-slate-800 font-display font-mono mt-1">{reportData.withFixed}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">With Local cash sales</span>
                    <span className="text-2xl font-extrabold block text-slate-800 font-display font-mono mt-1">{reportData.withLocal}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">In Maintenance</span>
                    <span className="text-2xl font-extrabold block text-slate-800 font-display font-mono mt-1">{reportData.maintenance}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Lost / Damaged</span>
                    <span className="text-2xl font-extrabold block text-slate-800 font-display font-mono mt-1">{reportData.lost}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 flex items-center justify-between text-sm font-bold text-slate-800">
                  <span>Audit Verification Check:</span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold uppercase">Sum vs Total Registered</span>
                    <span className="font-display font-extrabold text-base">
                      {reportData.available + reportData.withFixed + reportData.withLocal + reportData.maintenance + reportData.lost} / {reportData.totalCans} Cans
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 p-8 text-center text-slate-400">Failed to render report dashboard.</div>
      )}
    </div>
  );
};

export default Reports;
