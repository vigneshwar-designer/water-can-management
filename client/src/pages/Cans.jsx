import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { canService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeImage from '../components/QRCodeImage';
import { 
  FiSearch, FiPlus, FiGrid, FiPrinter, FiX, FiCheck, FiAlertTriangle,
  FiTrash2, FiRefreshCw, FiMapPin, FiClock, FiSettings, FiMaximize2
} from 'react-icons/fi';

const Cans = () => {
  const { settings } = useAuth();
  
  // Lists and Search
  const [cans, setCans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Page mode: 'grid' | 'print-preview'
  const [viewMode, setViewMode] = useState('grid'); 

  // Drawer / Modals States
  const [selectedCanId, setSelectedCanId] = useState(null);
  const [canDetails, setCanDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');

  // Add Can Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [canName, setCanName] = useState('');
  const [canIdInput, setCanIdInput] = useState('');
  
  // Bulk Can Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkPrefix, setBulkPrefix] = useState('Blue Can');

  // Magnified QR code modal
  const [magnifiedQr, setMagnifiedQr] = useState(null);

  // Status message
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Load Cans
  const fetchCans = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await canService.list(search, statusFilter);
      setCans(list);
    } catch (err) {
      console.error(err);
      setError('Failed to load can inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCans();
  }, [search, statusFilter]);

  // Load Single Can Details
  const handleSelectCan = async (canId) => {
    setSelectedCanId(canId);
    setDetailsLoading(true);
    try {
      const res = await canService.getByCanId(canId);
      const historyRes = await canService.getHistory(canId);
      setCanDetails({
        ...res.can,
        customer: res.customer,
        history: historyRes.history
      });
      setUpdatingStatus(res.can.status);
    } catch (err) {
      console.error(err);
      setCanDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close Can Drawer
  const closeDrawer = () => {
    setSelectedCanId(null);
    setCanDetails(null);
  };

  // Update Can Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!canDetails) return;
    setDetailsLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await canService.update(canDetails._id, updatingStatus);
      setActionSuccess('Can status updated successfully!');
      setTimeout(() => {
        setActionSuccess('');
        closeDrawer();
        fetchCans();
      }, 1200);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update can status.');
      setDetailsLoading(false);
    }
  };

  // Submit Add Can
  const handleAddCanSubmit = async (e) => {
    e.preventDefault();
    if (!canName || !canIdInput) {
      setActionError('Name and Unique Can ID are required.');
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      await canService.create({ canName, canId: canIdInput.toUpperCase() });
      setActionSuccess('Can registered successfully!');
      setCanName('');
      setCanIdInput('');
      setTimeout(() => {
        setShowAddModal(false);
        setActionSuccess('');
        fetchCans();
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to register can.');
    }
  };

  // Submit Bulk Cans
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const count = parseInt(bulkCount, 10);
    if (isNaN(count) || count <= 0) {
      setActionError('Please enter a valid count.');
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      await canService.bulkGenerate(count, bulkPrefix);
      setActionSuccess(`Successfully generated ${count} cans!`);
      setTimeout(() => {
        setShowBulkModal(false);
        setActionSuccess('');
        fetchCans();
      }, 1500);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to bulk generate cans.');
    }
  };

  // Trigger browser print
  const handlePrintTrigger = () => {
    window.print();
  };

  // Render Print Preview View Mode
  if (viewMode === 'print-preview') {
    return (
      <div className="space-y-6">
        {/* Floating actions control bar - Hidden during print */}
        <div className="no-print flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-premium">
          <div className="text-sm font-semibold text-slate-800">
            A4 Sticker Grid Preview ({cans.length} items selected)
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              Back to Inventory
            </button>
            <button 
              onClick={handlePrintTrigger}
              className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-xs shadow-md shadow-primary-50 transition-all flex items-center gap-1.5"
            >
              <FiPrinter size={14} />
              Print Labels Now
            </button>
          </div>
        </div>

        {/* The Print Area */}
        <div className="print-area bg-white p-4 rounded-2xl border border-slate-100 shadow-premium">
          <div className="sticker-page">
            <div className="sticker-grid grid grid-cols-2 sm:grid-cols-3 gap-6 p-4">
              {cans.map((can, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 aspect-square page-break"
                >
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase leading-none font-display">
                    {settings.businessName}
                  </span>
                  
                  <div className="border border-slate-100 p-1.5 rounded-lg bg-white shadow-sm">
                    <QRCodeImage value={can.canId} size={110} />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 leading-tight">{can.canName}</span>
                    <span className="text-[10px] font-bold text-primary-600 font-mono mt-0.5 leading-none">{can.canId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Cans Inventory</h1>
          <p className="text-slate-400 font-medium text-sm">Monitor can distribution status, bulk generate labels, and prepare sticker printing packages.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button 
            onClick={() => setViewMode('print-preview')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FiPrinter size={14} />
            <span>Print All QR ({cans.length})</span>
          </button>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-200 transition-colors"
          >
            <FiGrid size={14} />
            <span>Bulk Cans</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs hover:shadow-lg hover:shadow-primary-100 transition-all"
          >
            <FiPlus size={14} />
            <span>Register Can</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {[
            { label: 'All Cans', val: '' },
            { label: 'Available', val: 'Available' },
            { label: 'With Cust.', val: 'With Fixed Customer' },
            { label: 'Local Cust.', val: 'With Local Customer' },
            { label: 'Maintenance', val: 'Maintenance' },
            { label: 'Lost', val: 'Lost' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setStatusFilter(item.val)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === item.val
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Can ID or brand name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium focus:border-primary-500 shadow-premium outline-none transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Error / Alert banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3">
          <FiAlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Split screen layout: Grid + details drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Cans Grid list */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 font-medium">
              <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading inventory grid...
            </div>
          ) : cans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 font-medium shadow-premium">
              No physical cans matches your current filter queries.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {cans.map((can, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -2 }}
                  onClick={() => handleSelectCan(can.canId)}
                  className={`bg-white rounded-2xl border p-4 flex flex-col justify-between h-44 cursor-pointer shadow-premium relative transition-all ${
                    selectedCanId === can.canId 
                      ? 'border-primary-500 shadow-md shadow-primary-50' 
                      : 'border-slate-100 hover:border-primary-200'
                  }`}
                >
                  {/* Status Indicator Dot */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-700 text-xs block leading-tight truncate max-w-[100px]">{can.canName}</span>
                      <span className="font-bold text-primary-600 font-mono text-[10px] block mt-0.5 leading-none">{can.canId}</span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      can.status === 'Available' ? 'bg-emerald-500' :
                      can.status === 'With Fixed Customer' ? 'bg-blue-500' :
                      can.status === 'With Local Customer' ? 'bg-cyan-400' :
                      can.status === 'Maintenance' ? 'bg-amber-400' :
                      'bg-red-500'
                    }`} />
                  </div>

                  {/* QR code thumbnail */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMagnifiedQr(can.canId);
                    }}
                    className="self-center bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-lg p-1.5 flex items-center justify-center transition-colors"
                  >
                    <QRCodeImage value={can.canId} size={50} />
                  </div>

                  {/* Status tag */}
                  <div className="flex items-center justify-between text-[9px] font-extrabold uppercase mt-1">
                    <span className={`px-2 py-0.5 rounded ${
                      can.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                      can.status === 'With Fixed Customer' ? 'bg-blue-50 text-blue-700' :
                      can.status === 'With Local Customer' ? 'bg-cyan-50 text-accent-700' :
                      can.status === 'Maintenance' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {can.status.replace('With ', '')}
                    </span>
                    <FiMaximize2 className="text-slate-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Can Tracking details */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedCanId && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-slate-100 shadow-premium rounded-2xl overflow-hidden sticky top-6"
              >
                {detailsLoading ? (
                  <div className="p-8 text-center text-slate-400 font-medium">
                    <svg className="animate-spin h-6 w-6 text-primary-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading history...
                  </div>
                ) : canDetails ? (
                  <div className="flex flex-col max-h-[85vh] text-sm">
                    {/* Header */}
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base font-display">
                          {canDetails.canName}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium font-mono">
                          {canDetails.canId}
                        </span>
                      </div>
                      <button onClick={closeDrawer} className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                        <FiX size={14} />
                      </button>
                    </div>

                    {actionSuccess && (
                      <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                        <FiCheck size={14} />
                        <span>{actionSuccess}</span>
                      </div>
                    )}
                    {actionError && (
                      <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-1.5">
                        <FiAlertTriangle size={14} />
                        <span>{actionError}</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 space-y-5 overflow-y-auto flex-1 font-medium">
                      {/* Active Holder detail */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Current Ownership</span>
                        {canDetails.customer ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs font-display">
                              {canDetails.customer.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 text-sm block leading-none">{canDetails.customer.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-1 font-semibold capitalize">{canDetails.customerType} Customer</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 font-bold bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-2">
                            <FiCheck className="text-emerald-500 shrink-0" size={16} />
                            Available in Storage (Ready to deliver)
                          </div>
                        )}
                      </div>

                      {/* Status Editor form */}
                      <form onSubmit={handleUpdateStatus} className="space-y-2 border-t border-slate-100 pt-4">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Update Can Location Status</label>
                        <div className="flex gap-2">
                          <select 
                            value={updatingStatus}
                            onChange={(e) => setUpdatingStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:border-primary-500 outline-none"
                          >
                            <option value="Available">Available in stock</option>
                            <option value="Maintenance">In Maintenance / Cleaning</option>
                            <option value="Lost">Lost / Broken</option>
                            <option value="With Fixed Customer" disabled>With Fixed Customer (Triggered via Deliveries)</option>
                            <option value="With Local Customer" disabled>With Local Customer (Triggered via Deliveries)</option>
                          </select>
                          <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl shadow transition-colors">
                            Update
                          </button>
                        </div>
                      </form>

                      {/* Tracking History Timeline */}
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Movement History</span>
                        
                        <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                          {canDetails.history?.length === 0 ? (
                            <div className="text-xs text-slate-400 text-center py-4">No tracking history recorded.</div>
                          ) : (
                            canDetails.history.map((tx, idx) => (
                              <div key={idx} className="flex gap-3 text-xs">
                                {/* Dot and line */}
                                <div className="flex flex-col items-center shrink-0">
                                  <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
                                    tx.type === 'Delivery' ? 'bg-blue-500' : 'bg-purple-500'
                                  }`} />
                                  {idx !== canDetails.history.length - 1 && (
                                    <div className="w-0.5 bg-slate-100 flex-1 my-0.5" />
                                  )}
                                </div>
                                
                                {/* Info text */}
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-700 block leading-none">
                                    {tx.type === 'Delivery' ? 'Delivered' : 'Returned'} {tx.customerType === 'Local' ? '(Local)' : ''}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-medium">
                                    {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">Failed to load can history.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MAGNIFIED QR CODE MODAL VIEW */}
      <AnimatePresence>
        {magnifiedQr && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMagnifiedQr(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center gap-4 text-center max-w-sm w-full shadow-2xl shadow-slate-950/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3 mb-2">
                <span className="font-display font-extrabold text-slate-800 leading-none text-base">{settings.businessName} Label</span>
                <button onClick={() => setMagnifiedQr(null)} className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <FiX size={14} />
                </button>
              </div>

              <div className="border border-slate-100 p-3 rounded-2xl bg-white shadow-inner shadow-slate-50">
                <QRCodeImage value={magnifiedQr} size={200} />
              </div>
              
              <div>
                <span className="font-bold text-slate-800 text-sm block">Sequence barcode identifier</span>
                <span className="font-bold font-mono text-primary-600 block mt-1 text-base">{magnifiedQr}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER SINGLE CAN MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-premium border border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-display">Register Single Can</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <FiX size={16} />
                </button>
              </div>

              {actionError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-1.5">
                  <FiAlertTriangle size={14} />
                  <span>{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <FiCheck size={14} />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddCanSubmit} className="p-6 space-y-4 text-sm font-medium">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Can Name (Brand label)</label>
                  <input type="text" placeholder="e.g. Blue Can 51" value={canName} onChange={(e) => setCanName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Unique Can ID (Barcode code)</label>
                  <input type="text" placeholder="e.g. WC-0051" value={canIdInput} onChange={(e) => setCanIdInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm uppercase focus:bg-white focus:border-primary-500 outline-none font-mono" required />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-colors">Confirm Registry</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK CANS MODAL */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-premium border border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-display">Bulk Generate Cans</h3>
                <button onClick={() => setShowBulkModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <FiX size={16} />
                </button>
              </div>

              {actionError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-1.5">
                  <FiAlertTriangle size={14} />
                  <span>{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <FiCheck size={14} />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <form onSubmit={handleBulkSubmit} className="p-6 space-y-4 text-sm font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Quantity to Generate</label>
                    <input type="number" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none font-bold text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Label Brand Name</label>
                    <input type="text" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" required />
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-normal font-medium">
                  The system will automatically find the highest sequential WC ID (e.g. WC-0050) and generate the subsequent IDs sequentially.
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-colors">Generate Pack</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cans;
