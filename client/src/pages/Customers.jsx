import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { customerService, localCustomerService, paymentService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiPlus, FiChevronRight, FiPhone, FiMapPin, FiCalendar, 
  FiPackage, FiAlertCircle, FiCheck, FiDollarSign, FiX, FiActivity
} from 'react-icons/fi';

const Customers = () => {
  const { settings } = useAuth();
  
  // Tab states: 'fixed' | 'local'
  const [activeTab, setActiveTab] = useState('fixed');
  const [search, setSearch] = useState('');
  
  // List states
  const [fixedCustomers, setFixedCustomers] = useState([]);
  const [localCustomers, setLocalCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected customer details drawer states
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Collect Payment Modal (nested)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');

  // Load Lists
  const fetchLists = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'fixed') {
        const list = await customerService.list(search);
        setFixedCustomers(list);
      } else {
        const list = await localCustomerService.list(search);
        setLocalCustomers(list);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve customer list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [activeTab, search]);

  // Fetch individual details when drawer is opened
  const handleSelectCustomer = async (id, type) => {
    setSelectedCustomerId(id);
    setDetailsLoading(true);
    try {
      if (type === 'fixed') {
        const details = await customerService.get(id);
        setCustomerDetails({ ...details, type: 'fixed' });
      } else {
        const details = await localCustomerService.get(id);
        setCustomerDetails({ ...details, type: 'local' });
      }
    } catch (err) {
      console.error(err);
      setCustomerDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close details
  const closeDetails = () => {
    setSelectedCustomerId(null);
    setCustomerDetails(null);
  };

  // Submit New Customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setFormError('Name and Mobile phone are required.');
      return;
    }
    setFormError('');
    setFormSuccess('');
    try {
      await customerService.create({ name, phone, address });
      setFormSuccess('New Fixed customer profile created!');
      setName('');
      setPhone('');
      setAddress('');
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess('');
        fetchLists();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create customer.');
    }
  };

  // Submit Collect Payment
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    setFormError('');
    setFormSuccess('');
    try {
      await paymentService.collect(
        customerDetails.customer.customerId,
        Number(payAmount),
        payMethod,
        payNotes
      );
      setFormSuccess('Payment successfully collected!');
      setPayAmount('');
      setPayNotes('');
      setTimeout(() => {
        setShowPayModal(false);
        setFormSuccess('');
        // Refresh customer details and the master list
        handleSelectCustomer(customerDetails.customer._id, 'fixed');
        fetchLists();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Payment collection failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Customer Management</h1>
          <p className="text-slate-400 font-medium text-sm">Review accounts, pending balances, refundable deposits, and detailed transaction histories.</p>
        </div>
        {activeTab === 'fixed' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary-100 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <FiPlus size={16} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Tabs Toggles */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-max">
        <button 
          onClick={() => { setActiveTab('fixed'); closeDetails(); }}
          className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'fixed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Fixed Customers (Permanent)
        </button>
        <button 
          onClick={() => { setActiveTab('local'); closeDetails(); }}
          className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'local' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Local Customers (Temporary)
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder={activeTab === 'fixed' ? "Search by Name, Phone, or ID..." : "Search by Name or Mobile..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:border-primary-500 shadow-premium outline-none transition-all placeholder-slate-400"
        />
      </div>

      {/* Main List Layout split: List on left, Details on right (if selected) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* List View */}
        <div className={`lg:col-span-2 space-y-4`}>
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 font-medium">
              <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading list data...
            </div>
          ) : (
            <div className="bg-white border border-slate-100 shadow-premium rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Customer Profile</th>
                      {activeTab === 'fixed' ? (
                        <>
                          <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase text-center">Cans Held</th>
                          <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Pending Due</th>
                          <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Total Paid</th>
                        </>
                      ) : (
                        <>
                          <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase text-center">Active Cans</th>
                          <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Deposit Value</th>
                          <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Return Status</th>
                        </>
                      )}
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {activeTab === 'fixed' ? (
                      fixedCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-5 py-8 text-center text-slate-400">No fixed accounts match your query.</td>
                        </tr>
                      ) : (
                        fixedCustomers.map((cust, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => handleSelectCustomer(cust._id, 'fixed')}
                            className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedCustomerId === cust._id ? 'bg-primary-50/20 hover:bg-primary-50/20' : ''}`}
                          >
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-800">{cust.name}</div>
                              <div className="text-xs text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                                <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-500 font-bold">{cust.customerId}</span>
                                <span>{cust.phone}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center text-slate-700 font-semibold font-mono">
                              {cust.canBalance}
                            </td>
                            <td className="px-5 py-4 font-semibold text-red-500">
                              ₹{cust.pendingAmount}
                            </td>
                            <td className="px-5 py-4 text-slate-500">
                              ₹{cust.totalPaid}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <FiChevronRight className="inline-block text-slate-400 hover:text-slate-600" size={18} />
                            </td>
                          </tr>
                        ))
                      )
                    ) : (
                      localCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-5 py-8 text-center text-slate-400">No local accounts match your query.</td>
                        </tr>
                      ) : (
                        localCustomers.map((cust, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => handleSelectCustomer(cust._id, 'local')}
                            className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedCustomerId === cust._id ? 'bg-primary-50/20 hover:bg-primary-50/20' : ''}`}
                          >
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-800">{cust.name}</div>
                              <div className="text-xs text-slate-400 mt-1 font-medium">{cust.phone}</div>
                            </td>
                            <td className="px-5 py-4 text-center text-slate-700 font-semibold font-mono">
                              {cust.currentCans?.length || 0}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-700">
                              ₹{cust.depositAmount}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                cust.returnStatus === 'Returned' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {cust.returnStatus}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <FiChevronRight className="inline-block text-slate-400 hover:text-slate-600" size={18} />
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Selected Customer Details Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedCustomerId && (
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
                    Loading info...
                  </div>
                ) : customerDetails ? (
                  <div className="flex flex-col max-h-[85vh] text-sm">
                    {/* Header */}
                    <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base font-display">
                          {customerDetails.customer.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium font-mono capitalize">
                          {customerDetails.type} Customer
                        </span>
                      </div>
                      <button onClick={closeDetails} className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                        <FiX size={14} />
                      </button>
                    </div>

                    {/* Content Scroll */}
                    <div className="p-5 space-y-6 overflow-y-auto flex-1 font-medium">
                      {/* Contacts details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-slate-600">
                          <FiPhone size={15} className="text-slate-400" />
                          <span>{customerDetails.customer.phone}</span>
                        </div>
                        {customerDetails.customer.address && (
                          <div className="flex items-start gap-2.5 text-slate-600">
                            <FiMapPin size={15} className="text-slate-400 mt-0.5" />
                            <span className="leading-tight">{customerDetails.customer.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-slate-500 text-xs">
                          <FiCalendar size={15} className="text-slate-400" />
                          <span>Joined: {new Date(customerDetails.customer.createdDate || customerDetails.customer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Financial / Inventory stats */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Outstanding cans</span>
                          <span className="text-xl font-extrabold block text-slate-800 font-display mt-0.5 flex items-center gap-1.5">
                            <FiPackage size={16} className="text-primary-600" />
                            {customerDetails.type === 'fixed' 
                              ? customerDetails.customer.canBalance 
                              : customerDetails.customer.currentCans?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                            {customerDetails.type === 'fixed' ? 'Pending tab' : 'Deposit held'}
                          </span>
                          <span className={`text-xl font-extrabold block font-display mt-0.5 ${
                            customerDetails.type === 'fixed' && customerDetails.customer.pendingAmount > 0 
                              ? 'text-red-500' 
                              : 'text-slate-800'
                          }`}>
                            ₹{customerDetails.type === 'fixed' 
                              ? customerDetails.customer.pendingAmount 
                              : customerDetails.customer.depositAmount}
                          </span>
                        </div>
                      </div>

                      {/* Fixed account summaries */}
                      {customerDetails.type === 'fixed' && (
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                          <div>
                            <span className="text-slate-400 block font-normal text-[10px]">Delivered</span>
                            <span className="text-slate-700 font-bold block mt-0.5 font-mono">{customerDetails.customer.totalDelivered}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal text-[10px]">Returned</span>
                            <span className="text-slate-700 font-bold block mt-0.5 font-mono">{customerDetails.customer.totalReturned}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal text-[10px]">Total Paid</span>
                            <span className="text-emerald-600 font-bold block mt-0.5 font-mono">₹{customerDetails.customer.totalPaid}</span>
                          </div>
                        </div>
                      )}

                      {/* Local customer active holding lists */}
                      {customerDetails.type === 'local' && customerDetails.customer.currentCans?.length > 0 && (
                        <div className="space-y-2 border-t border-slate-100 pt-4">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Active Cans In Hand</span>
                          <div className="flex flex-wrap gap-1.5">
                            {customerDetails.customer.currentCans.map((id, idx) => (
                              <span key={idx} className="font-mono bg-blue-50 border border-blue-100 text-primary-700 rounded-lg px-2.5 py-1 text-xs font-bold">
                                {id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transaction History log list */}
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <FiActivity size={14} /> History Log
                        </span>
                        
                        <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                          {customerDetails.transactions?.length === 0 ? (
                            <span className="text-xs text-slate-400 block py-4 text-center font-medium">No activity log found.</span>
                          ) : (
                            customerDetails.transactions?.map((tx, idx) => (
                              <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-50 transition-all">
                                <div>
                                  <div className="font-bold text-slate-700">{tx.type} {tx.canId ? `(${tx.canId})` : ''}</div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`font-bold block ${
                                    tx.type === 'Payment' || tx.type === 'Refund' ? 'text-emerald-600' : 'text-slate-800'
                                  }`}>
                                    {tx.type === 'Return' ? '-' : `₹${tx.amount}`}
                                  </span>
                                  {tx.type === 'Delivery' && (
                                    <span className={`inline-block text-[9px] font-bold px-1 rounded ${
                                      tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                      {tx.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    {customerDetails.type === 'fixed' && customerDetails.customer.pendingAmount > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                        <button 
                          onClick={() => {
                            setPayAmount(customerDetails.customer.pendingAmount.toString());
                            setShowPayModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-1 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs hover:bg-primary-700 active:scale-95 transition-all shadow-md shadow-primary-50"
                        >
                          <FiDollarSign size={14} />
                          Collect Outstanding Payment
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">Failed to load details.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CREATE FIXED CUSTOMER MODAL */}
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
                <h3 className="font-bold text-slate-800 font-display">Add Fixed Customer Profile</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <FiX size={16} />
                </button>
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <FiCheck size={14} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddCustomer} className="p-6 space-y-4 text-sm font-medium">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Customer Name</label>
                  <input type="text" placeholder="e.g. Anand Sharma" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Phone Mobile</label>
                  <input type="tel" placeholder="10 digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Address</label>
                  <textarea placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none h-20" />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-colors">Create Account</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COLLECT PAYMENT NESTED MODAL */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-premium border border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-display">Collect Payment</h3>
                <button onClick={() => setShowPayModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <FiX size={16} />
                </button>
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                  <FiAlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <FiCheck size={14} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCollectPayment} className="p-6 space-y-4 text-sm font-medium">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Collected (₹)</label>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none font-bold text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Method</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Notes</label>
                  <input type="text" placeholder="e.g. Monthly settlement" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-colors">Collect Payment</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
