import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardService, customerService, canService, transactionService, paymentService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiDollarSign, FiClock, FiShield, FiCornerDownLeft, FiTruck, 
  FiRefreshCw, FiPlus, FiGrid, FiList, FiAlertTriangle, FiCheck, FiX, 
  FiCamera, FiCreditCard, FiSmartphone
} from 'react-icons/fi';

const Dashboard = ({ onOpenScanner }) => {
  const { settings } = useAuth();
  
  // Dashboard states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState(null); // 'deliver' | 'return' | 'payment' | 'customer' | 'can'
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Dropdown list cache
  const [customers, setCustomers] = useState([]);
  const [availableCans, setAvailableCans] = useState([]);

  // Form states
  const [deliveryType, setDeliveryType] = useState('Fixed'); // 'Fixed' | 'Local'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [localName, setLocalName] = useState('');
  const [localPhone, setLocalPhone] = useState('');
  const [deliveryCanIdsStr, setDeliveryCanIdsStr] = useState(''); // comma separated Can IDs
  const [deliveryAmountPaid, setDeliveryAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Return Form state
  const [returnCanId, setReturnCanId] = useState('');

  // Add Customer Form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Add Can state
  const [canCount, setCanCount] = useState('10');
  const [canBaseName, setCanBaseName] = useState('Blue Can');

  // Collect Payment Form state
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Fetch Dashboard Stats
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const summary = await dashboardService.getSummary();
      setData(summary);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch Cache lists when modals open
  const openModal = async (modalName) => {
    setActiveModal(modalName);
    setModalError('');
    setModalSuccess('');
    try {
      if (modalName === 'deliver' || modalName === 'payment') {
        const custList = await customerService.list();
        setCustomers(custList);
      }
      if (modalName === 'deliver') {
        const cansList = await canService.list('', 'Available');
        setAvailableCans(cansList);
      }
    } catch (err) {
      console.error("Failed to load selectors:", err);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError('');
    setModalSuccess('');
    // Clear inputs
    setSelectedCustomerId('');
    setLocalName('');
    setLocalPhone('');
    setDeliveryCanIdsStr('');
    setDeliveryAmountPaid('0');
    setPaymentMethod('Cash');
    setReturnCanId('');
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCanCount('10');
    setPaymentCustomerId('');
    setPaymentAmount('');
    setPaymentNotes('');
  };

  // Submit Quick Delivery
  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    
    // Parse canIds
    const parsedCanIds = deliveryCanIdsStr
      .split(',')
      .map(id => id.trim().toUpperCase())
      .filter(id => id.length > 0);

    if (parsedCanIds.length === 0) {
      setModalError('Please enter at least one valid Can ID.');
      setModalLoading(false);
      return;
    }

    try {
      if (deliveryType === 'Fixed') {
        if (!selectedCustomerId) {
          setModalError('Please select a customer.');
          setModalLoading(false);
          return;
        }
        await transactionService.deliverFixed(
          selectedCustomerId,
          parsedCanIds,
          Number(deliveryAmountPaid),
          paymentMethod
        );
      } else {
        if (!localName || !localPhone) {
          setModalError('Please enter local customer name and mobile.');
          setModalLoading(false);
          return;
        }
        await transactionService.deliverLocal(
          localName,
          localPhone,
          parsedCanIds,
          Number(deliveryAmountPaid),
          paymentMethod
        );
      }

      setModalSuccess('Delivery processed successfully!');
      setTimeout(() => {
        closeModal();
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error processing delivery.');
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Quick Return
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnCanId) {
      setModalError('Please enter a Can ID.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await transactionService.returnCan(returnCanId.trim().toUpperCase());
      setModalSuccess(`Can ${returnCanId} successfully returned to inventory!`);
      setTimeout(() => {
        closeModal();
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error processing return.');
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Collect Payment
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentCustomerId || !paymentAmount) {
      setModalError('Please select a customer and enter payment amount.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await paymentService.collect(
        paymentCustomerId,
        Number(paymentAmount),
        paymentMethod,
        paymentNotes
      );
      setModalSuccess('Payment successfully collected and updated!');
      setTimeout(() => {
        closeModal();
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error collecting payment.');
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Add Customer
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!custName || !custPhone) {
      setModalError('Name and Mobile number are required.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await customerService.create({ name: custName, phone: custPhone, address: custAddress });
      setModalSuccess('New Fixed Customer profile created!');
      setTimeout(() => {
        closeModal();
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error creating customer.');
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Bulk Can Generation
  const handleCanSubmit = async (e) => {
    e.preventDefault();
    const count = parseInt(canCount, 10);
    if (isNaN(count) || count <= 0) {
      setModalError('Please enter a valid count.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await canService.bulkGenerate(count, canBaseName);
      setModalSuccess(`Successfully bulk generated ${count} cans!`);
      setTimeout(() => {
        closeModal();
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error generating cans.');
    } finally {
      setModalLoading(false);
    }
  };

  // Quick Action card click helper
  const handleQuickAction = (action) => {
    if (action === 'scan') {
      onOpenScanner();
    } else {
      openModal(action);
    }
  };

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-medium text-sm">Loading summary metrics...</span>
        </div>
      </div>
    );
  }

  const { todaySummary, inventorySummary, recentTransactions, pendingCollections } = data || {};

  // Form calculations on delivery input
  const deliveryQty = deliveryCanIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0).length;
  const currentPrice = settings.waterPrice;
  const currentDeposit = settings.depositAmount;
  const waterChargesCalc = currentPrice * deliveryQty;
  const depositChargesCalc = deliveryType === 'Local' ? currentDeposit * deliveryQty : 0;
  const totalBillCalc = waterChargesCalc + depositChargesCalc;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Overview Dashboard</h1>
        <p className="text-slate-400 font-medium text-sm">Real-time metrics, quick actions, and transaction summaries.</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3">
          <FiAlertTriangle size={18} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Today's Summary Section */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Today's Transactions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard title="Water Revenue" value={`₹${todaySummary?.waterRevenue}`} icon={FiDollarSign} color="bg-emerald-50 text-emerald-600" />
          <StatCard title="Pending Payments" value={`₹${todaySummary?.pendingPayments}`} icon={FiClock} color="bg-amber-50 text-amber-600" />
          <StatCard title="Deposits Held" value={`₹${todaySummary?.depositsHeld}`} icon={FiShield} color="bg-blue-50 text-blue-600" />
          <StatCard title="Deposits Refunded" value={`₹${todaySummary?.depositsRefunded}`} icon={FiCornerDownLeft} color="bg-cyan-50 text-accent-600" />
          <StatCard title="Delivered Today" value={`${todaySummary?.cansDeliveredToday} Cans`} icon={FiTruck} color="bg-indigo-50 text-indigo-600" />
          <StatCard title="Returned Today" value={`${todaySummary?.cansReturnedToday} Cans`} icon={FiRefreshCw} color="bg-purple-50 text-purple-600" />
        </div>
      </div>

      {/* Inventory & Reconciliation Warning */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Inventory Reconciliation</h2>
          {inventorySummary?.isMismatch && (
            <span className="bg-red-50 border border-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <FiAlertTriangle size={12} />
              Reconciliation Mismatch!
            </span>
          )}
        </div>
        
        {/* Inventory numbers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <InventoryMetric label="Total Inventory" count={inventorySummary?.totalCans} detail="Total registered physical cans" />
            <InventoryMetric label="Available in Stock" count={inventorySummary?.available} detail="Ready for distribution" highlight="text-emerald-600" />
            <InventoryMetric label="With Fixed Cust." count={inventorySummary?.withFixed} detail="At permanent accounts" />
            <InventoryMetric label="With Local Cust." count={inventorySummary?.withLocal} detail="Temporary cash holders" />
            <InventoryMetric label="In Maintenance" count={inventorySummary?.maintenance} detail="Damaged or cleaning" highlight="text-amber-500" />
            <InventoryMetric label="Lost / Broken" count={inventorySummary?.lost} detail="Missing from loop" highlight="text-red-500" />
          </div>

          {/* Mismatch Warning Alert Box */}
          {inventorySummary?.isMismatch && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex gap-3">
              <FiAlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Inventory Reconciliation Error</span>
                <span className="font-medium text-red-500">{inventorySummary.mismatchDetail} Verify that lost or maintenance status edits are accounted for.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Quick Operations</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <QuickActionBtn label="Scan Can" sub="Check QR & return" icon={FiCamera} action={() => handleQuickAction('scan')} gradient="from-primary-600 to-accent-500 text-white" />
          <QuickActionBtn label="Deliver Can" sub="Distribute water" icon={FiTruck} action={() => handleQuickAction('deliver')} />
          <QuickActionBtn label="Return Can" sub="Stock back in" icon={FiCornerDownLeft} action={() => handleQuickAction('return')} />
          <QuickActionBtn label="Collect Payment" sub="Clear customer tabs" icon={FiCreditCard} action={() => handleQuickAction('payment')} />
          <QuickActionBtn label="Add Customer" sub="Register fixed account" icon={FiPlus} action={() => handleQuickAction('customer')} />
          <QuickActionBtn label="Add Can" sub="Bulk generate barcodes" icon={FiGrid} action={() => handleQuickAction('can')} />
        </div>
      </div>

      {/* Bottom Layout Split: Transactions and Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Recent Activity</h2>
            <Link to="/reports" className="text-primary-600 hover:text-primary-700 font-semibold text-xs transition-colors flex items-center gap-1">
              View All Logs
            </Link>
          </div>
          
          <div className="bg-white border border-slate-100 shadow-premium rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">TXID / Date</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Cans</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {recentTransactions?.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                        No transactions recorded today yet.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions?.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-700">{tx.transactionId}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            tx.type === 'Delivery' ? 'bg-blue-50 text-primary-600' :
                            tx.type === 'Return' ? 'bg-purple-50 text-purple-600' :
                            tx.type === 'Payment' ? 'bg-emerald-50 text-emerald-600' :
                            tx.type === 'Deposit' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-mono">
                          {tx.canId ? tx.canId : `${tx.quantity} pcs`}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          ₹{tx.amount}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                            tx.status === 'Refunded' ? 'bg-cyan-50 text-accent-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Collections Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Pending Collections</h2>
            <Link to="/customers" className="text-primary-600 hover:text-primary-700 font-semibold text-xs transition-colors">
              Manage Tabs
            </Link>
          </div>

          <div className="bg-white border border-slate-100 shadow-premium rounded-2xl p-5 space-y-4">
            {pendingCollections?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm font-medium">
                🎉 Awesome! All fixed customers are fully paid up.
              </div>
            ) : (
              pendingCollections?.map((cust, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-700 text-sm block truncate">{cust.name}</span>
                    <span className="text-xs text-slate-400 block font-medium mt-0.5">{cust.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-red-500 text-sm block">₹{cust.pendingAmount}</span>
                    <button 
                      onClick={() => {
                        openModal('payment');
                        setPaymentCustomerId(cust.customerId);
                        setPaymentAmount(cust.pendingAmount.toString());
                      }}
                      className="text-xs text-primary-600 hover:underline font-bold mt-1 inline-block"
                    >
                      Collect Pay
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS MODALS POPUPS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-premium border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-display">
                  {activeModal === 'deliver' && 'Register Water Delivery'}
                  {activeModal === 'return' && 'Process Can Return'}
                  {activeModal === 'payment' && 'Collect Customer Payment'}
                  {activeModal === 'customer' && 'Create Customer Account'}
                  {activeModal === 'can' && 'Bulk Generate Inventory'}
                </h3>
                <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
                  <FiX size={16} />
                </button>
              </div>

              {/* Modal Alert Message banner */}
              {modalError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                  <FiAlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <FiCheck size={14} className="shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Form body */}
              <form 
                onSubmit={
                  activeModal === 'deliver' ? handleDeliverySubmit :
                  activeModal === 'return' ? handleReturnSubmit :
                  activeModal === 'payment' ? handlePaymentSubmit :
                  activeModal === 'customer' ? handleCustomerSubmit :
                  handleCanSubmit
                } 
                className="p-6 space-y-4 overflow-y-auto flex-1 text-sm font-medium"
              >
                {/* 1. DELIVERY ACTION FORM */}
                {activeModal === 'deliver' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Customer Type</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setDeliveryType('Fixed')} className={`py-2 text-xs font-bold rounded-lg transition-all ${deliveryType === 'Fixed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Fixed Account</button>
                        <button type="button" onClick={() => setDeliveryType('Local')} className={`py-2 text-xs font-bold rounded-lg transition-all ${deliveryType === 'Local' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Local Customer</button>
                      </div>
                    </div>

                    {deliveryType === 'Fixed' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Fixed Customer</label>
                        <select 
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:border-primary-500 outline-none text-sm"
                        >
                          <option value="">-- Choose Account --</option>
                          {customers.map((c, idx) => (
                            <option key={idx} value={c.customerId}>{c.name} ({c.customerId}) - Bal: {c.canBalance} cans</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Customer Name</label>
                          <input type="text" placeholder="e.g. John Doe" value={localName} onChange={(e) => setLocalName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Mobile Phone</label>
                          <input type="tel" placeholder="10 digit number" value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" />
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase">Scanned / Input Can IDs</label>
                        <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded font-bold">Comma separated</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="e.g. WC-0001, WC-0002" 
                        value={deliveryCanIdsStr}
                        onChange={(e) => setDeliveryCanIdsStr(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 font-mono text-sm focus:bg-white focus:border-primary-500 outline-none"
                      />
                      {/* Available Cans tags shortcut */}
                      {availableCans.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[10px] text-slate-400 block mb-1">Available cans in stock (Tap to add):</span>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {availableCans.slice(0, 10).map((c, idx) => (
                              <button 
                                type="button"
                                key={idx}
                                onClick={() => {
                                  const trimmed = deliveryCanIdsStr.trim();
                                  const suffix = trimmed ? (trimmed.endsWith(',') ? ' ' : ', ') : '';
                                  if (!deliveryCanIdsStr.includes(c.canId)) {
                                    setDeliveryCanIdsStr(trimmed + suffix + c.canId);
                                  }
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-primary-50 hover:text-primary-600 rounded px-1.5 py-0.5 border border-slate-200/50"
                              >
                                {c.canId}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Water Charge: {deliveryQty} cans × ₹{currentPrice}</span>
                        <span>₹{waterChargesCalc}</span>
                      </div>
                      {deliveryType === 'Local' && (
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>Deposit Held: {deliveryQty} cans × ₹{currentDeposit} (Refundable)</span>
                          <span>₹{depositChargesCalc}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200/60 pt-2">
                        <span>Grand Total Bill:</span>
                        <span className="text-primary-600">₹{totalBillCalc}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Amount Paid (₹)</label>
                        <input type="number" value={deliveryAmountPaid} onChange={(e) => setDeliveryAmountPaid(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Payment Method</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none">
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. RETURN ACTION FORM */}
                {activeModal === 'return' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Input / Scan Can ID to Return</label>
                      <button type="button" onClick={() => { closeModal(); onOpenScanner(); }} className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
                        <FiCamera /> Launch Scanner
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. WC-0001" 
                      value={returnCanId}
                      onChange={(e) => setReturnCanId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 font-mono text-sm uppercase focus:bg-white focus:border-primary-500 outline-none"
                    />
                    <p className="text-xs text-slate-400 font-medium leading-normal mt-2">
                      On confirmation, the can will be identified (linked Fixed customer or Local customer), returned to the inventory stock, and any refundable deposits will be automatically generated.
                    </p>
                  </div>
                )}

                {/* 3. COLLECT PAYMENT FORM */}
                {activeModal === 'payment' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Customer Account</label>
                      <select 
                        value={paymentCustomerId}
                        onChange={(e) => {
                          setPaymentCustomerId(e.target.value);
                          const currentCust = customers.find(c => c.customerId === e.target.value);
                          if (currentCust) {
                            setPaymentAmount(currentCust.pendingAmount.toString());
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:border-primary-500 outline-none"
                      >
                        <option value="">-- Select Customer --</option>
                        {customers.map((c, idx) => (
                          <option key={idx} value={c.customerId}>{c.name} (Tab: ₹{c.pendingAmount})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Collected Amount (₹)</label>
                        <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Method</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none">
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank">Bank Transfer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Notes</label>
                      <input type="text" placeholder="e.g. Month end settlement" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:border-primary-500 outline-none" />
                    </div>
                  </>
                )}

                {/* 4. ADD FIXED CUSTOMER FORM */}
                {activeModal === 'customer' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
                      <input type="text" placeholder="e.g. Ramesh Kumar" value={custName} onChange={(e) => setCustName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Mobile Phone</label>
                      <input type="tel" placeholder="10 digit number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" required />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Billing/Delivery Address</label>
                      <textarea placeholder="Complete street address" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none h-20" />
                    </div>
                  </>
                )}

                {/* 5. BULK GENERATE CANS FORM */}
                {activeModal === 'can' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Number of Cans to Generate</label>
                        <input type="number" value={canCount} onChange={(e) => setCanCount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Base Brand Label</label>
                        <input type="text" value={canBaseName} onChange={(e) => setCanBaseName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:bg-white focus:border-primary-500 outline-none" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-normal">
                      Cans will be named sequentially (e.g. {canBaseName} 01, {canBaseName} 02...) and assigned matching sequental codes (e.g. WC-0001, WC-0002...). Printable QR Codes will be automatically prepared.
                    </p>
                  </>
                )}

                {/* Submit Trigger */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={modalLoading} 
                    className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    {modalLoading && (
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Confirm Operation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component: Stat Card
const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-premium p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">{title}</span>
        <span className="text-base font-bold text-slate-800 block mt-1 truncate">{value}</span>
      </div>
    </motion.div>
  );
};

// Sub-component: InventoryMetric
const InventoryMetric = ({ label, count, detail, highlight = "text-slate-800" }) => {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">{label}</span>
      <span className={`text-2xl font-extrabold block font-display ${highlight}`}>{count}</span>
      <span className="text-[10px] text-slate-400 block font-medium leading-none">{detail}</span>
    </div>
  );
};

// Sub-component: QuickActionBtn
const QuickActionBtn = ({ label, sub, icon: Icon, action, gradient }) => {
  const isCustom = !!gradient;
  return (
    <motion.button 
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={action}
      className={`p-5 rounded-2xl text-left border flex flex-col justify-between h-36 relative overflow-hidden shadow-premium ${
        isCustom 
          ? `bg-gradient-to-tr ${gradient} border-transparent` 
          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-primary-100'
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${isCustom ? 'bg-white/10' : 'bg-slate-50 text-primary-600'}`}>
        <Icon size={22} className={isCustom ? 'text-white' : 'text-primary-600'} />
      </div>
      <div>
        <span className={`font-bold font-display text-sm block ${isCustom ? 'text-white' : 'text-slate-800'}`}>{label}</span>
        <span className={`text-[10px] block mt-0.5 font-medium leading-none ${isCustom ? 'text-white/70' : 'text-slate-400'}`}>{sub}</span>
      </div>
    </motion.button>
  );
};

export default Dashboard;
