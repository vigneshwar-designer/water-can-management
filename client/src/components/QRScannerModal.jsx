import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { canService, customerService, transactionService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiCamera, FiCheckCircle, FiAlertTriangle, FiUser,
  FiPackage, FiCornerDownLeft, FiTruck, FiDollarSign, FiZap
} from 'react-icons/fi';

const QRScannerModal = ({ isOpen, onClose, onRefreshData }) => {
  const { settings } = useAuth();
  const [scanResult, setScanResult] = useState(''); // Decoded canId
  const [canData, setCanData] = useState(null); // Backend info for can
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [activeAction, setActiveAction] = useState(null); // 'deliver-fixed' | 'deliver-local'

  // Input lists for forms
  const [fixedCustomers, setFixedCustomers] = useState([]);

  // Deliver Forms states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [localName, setLocalName] = useState('');
  const [localPhone, setLocalPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Scanner scanner element ref and instance
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // Manual Input Simulator state
  const [simulatorCanId, setSimulatorCanId] = useState('');

  // Fetch Fixed customers when scanning to deliver
  const loadSelectorLists = async () => {
    try {
      const list = await customerService.list();
      setFixedCustomers(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSelectorLists();
      // Start QR camera scanner in browser
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setScanError('');
    // Wait for DOM element
    setTimeout(async () => {
      try {
        const scannerElement = document.getElementById('viewfinder');
        if (!scannerElement) return;

        const html5Qrcode = new Html5Qrcode('viewfinder');
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' }, // Back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR Scanned Successfully!
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Constant polling errors are ignored for clean logs
          }
        );
      } catch (err) {
        console.warn('Browser camera failed or not available:', err);
        setScanError('Camera not detected. Use the Scan Simulator box below.');
      }
    }, 300);
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };

  // Process decoded code
  const handleScanSuccess = async (canId) => {
    stopCamera();
    setScanResult(canId);
    setLoading(true);
    setScanError('');
    setScanSuccess('');
    try {
      const res = await canService.getByCanId(canId);
      setCanData(res);
      // Pre-fill fields
      if (res.can.status === 'Available') {
        // Estimate local payments: Water (30) + Deposit (200) = 230
        setAmountPaid((settings.waterPrice + settings.depositAmount).toString());
      }
    } catch (err) {
      console.error(err);
      setScanError(err.response?.data?.message || `Can code ${canId} is not registered.`);
    } finally {
      setLoading(false);
    }
  };

  // Submit Simulator input
  const handleSimulatorSubmit = (e) => {
    e.preventDefault();
    if (!simulatorCanId) return;
    handleScanSuccess(simulatorCanId.trim().toUpperCase());
  };

  // Process Delivery Submission
  const handleDeliveryConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setScanError('');
    try {
      if (activeAction === 'deliver-fixed') {
        if (!selectedCustomerId) {
          setScanError('Please select a customer.');
          setLoading(false);
          return;
        }
        await transactionService.deliverFixed(
          selectedCustomerId,
          [scanResult],
          Number(amountPaid),
          paymentMethod
        );
      } else {
        if (!localName || !localPhone) {
          setScanError('Name and phone numbers are required.');
          setLoading(false);
          return;
        }
        await transactionService.deliverLocal(
          localName,
          localPhone,
          [scanResult],
          Number(amountPaid),
          paymentMethod
        );
      }

      setScanSuccess('Can successfully delivered!');
      setTimeout(() => {
        handleClose();
        if (onRefreshData) onRefreshData();
      }, 1500);
    } catch (err) {
      setScanError(err.response?.data?.message || 'Failed to deliver can.');
    } finally {
      setLoading(false);
    }
  };

  // Process Return Confirmation
  const handleReturnConfirm = async () => {
    setLoading(true);
    setScanError('');
    setScanSuccess('');
    try {
      await transactionService.returnCan(scanResult);
      const isLocal = canData.can.status === 'With Local Customer';
      setScanSuccess(
        isLocal
          ? `Can returned! Refund of ₹${settings.depositAmount} is issued.`
          : 'Can successfully returned to inventory stock!'
      );
      setTimeout(() => {
        handleClose();
        if (onRefreshData) onRefreshData();
      }, 2000);
    } catch (err) {
      setScanError(err.response?.data?.message || 'Failed to return can.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Scanner
  const resetScanner = () => {
    setScanResult('');
    setCanData(null);
    setActiveAction(null);
    setScanError('');
    setScanSuccess('');
    setSimulatorCanId('');
    setSelectedCustomerId('');
    setLocalName('');
    setLocalPhone('');
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    // Clear forms
    setScanResult('');
    setCanData(null);
    setActiveAction(null);
    setScanError('');
    setScanSuccess('');
    setSimulatorCanId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl shadow-slate-950/50 border border-slate-100 text-sm font-medium"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold font-display">
            <FiCamera className="text-primary-600 animate-pulse" />
            <span>QR Scanner Terminal</span>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors">
            <FiX size={16} />
          </button>
        </div>

        {/* Dynamic Alerts */}
        {scanError && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
            <FiAlertTriangle size={14} className="shrink-0" />
            <span>{scanError}</span>
          </div>
        )}
        {scanSuccess && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <FiCheckCircle size={14} className="shrink-0" />
            <span>{scanSuccess}</span>
          </div>
        )}

        {/* Inner Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: CAMERA STREAM (if no scanResult) */}
          {!scanResult && (
            <div className="space-y-4">
              {/* viewfinder container */}
              <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-900 rounded-2xl overflow-hidden border-2 border-primary-500/20 flex items-center justify-center shadow-inner shadow-slate-950">
                <div id="viewfinder" className="w-full h-full object-cover"></div>
                {/* Scanner targeting laser overlay */}
                <div className="absolute inset-x-6 h-0.5 bg-red-500/80 animate-scan-line shadow-[0_0_8px_#ef4444]" />
              </div>

              {/* Headless Verification Simulator Form */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                  🛠️ HEADLESS SCAN SIMULATOR
                </span>
                <form onSubmit={handleSimulatorSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Can ID (e.g. WC-0001)"
                    value={simulatorCanId}
                    onChange={(e) => setSimulatorCanId(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono uppercase focus:bg-white focus:border-primary-500 outline-none"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-1 shrink-0 shadow shadow-primary-50">
                    <FiZap size={12} /> Scan Code
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS & OPERATIONS (after code parsed) */}
          {scanResult && (
            <div className="space-y-5">
              {/* Loading stats */}
              {loading && !canData ? (
                <div className="py-8 text-center text-slate-400 font-semibold flex flex-col items-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resolving Can registry...
                </div>
              ) : canData ? (
                <div className="space-y-4">
                  {/* Can Info Panel */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                      <FiPackage size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 leading-none">{canData.can.canName}</h4>
                      <span className="font-bold font-mono text-primary-600 text-[10px] block mt-1">{canData.can.canId}</span>
                    </div>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${canData.can.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                      {canData.can.status.replace('With ', '')}
                    </span>
                  </div>

                  {/* OPERATION FLOWS */}
                  {/* CASE A: CAN IS IN STOCK -> DELIVER */}
                  {canData.can.status === 'Available' && !activeAction && (
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Can is Available. Select action:</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveAction('deliver-fixed')}
                          className="flex flex-col items-center justify-center gap-1.5 p-4 border border-slate-200 rounded-xl hover:bg-primary-50/20 hover:border-primary-300 transition-all text-slate-700 font-bold"
                        >
                          <FiUser size={20} className="text-primary-600" />
                          <span>Fixed Account</span>
                        </button>
                        <button
                          onClick={() => setActiveAction('deliver-local')}
                          className="flex flex-col items-center justify-center gap-1.5 p-4 border border-slate-200 rounded-xl hover:bg-cyan-50/20 hover:border-accent-300 transition-all text-slate-700 font-bold"
                        >
                          <FiTruck size={20} className="text-accent-600" />
                          <span>Local Customer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delivery Inputs form fields */}
                  {activeAction && (
                    <form onSubmit={handleDeliveryConfirm} className="space-y-4 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          {activeAction === 'deliver-fixed' ? 'Deliver to Fixed Account' : 'Deliver to Local Customer'}
                        </span>
                        <button type="button" onClick={() => setActiveAction(null)} className="text-[10px] text-slate-400 hover:underline">Change</button>
                      </div>

                      {activeAction === 'deliver-fixed' ? (
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Select Customer</label>
                          <select
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:bg-white focus:border-primary-500 outline-none"
                            required
                          >
                            <option value="">-- Choose Account --</option>
                            {fixedCustomers.map((c, idx) => (
                              <option key={idx} value={c.customerId}>{c.name} ({c.customerId})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Name</label>
                            <input type="text" placeholder="John Doe" value={localName} onChange={(e) => setLocalName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:bg-white focus:border-primary-500 outline-none" required />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Mobile Phone</label>
                            <input type="tel" placeholder="10 digit number" value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:bg-white focus:border-primary-500 outline-none" required />
                          </div>
                        </div>
                      )}

                      {/* Pricing display */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Water Charges:</span>
                          <span>₹{settings.waterPrice}</span>
                        </div>
                        {activeAction === 'deliver-local' && (
                          <div className="flex justify-between">
                            <span>Refundable Deposit:</span>
                            <span>₹{settings.depositAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-700 border-t border-slate-200/50 pt-1.5">
                          <span>Grand Total Due:</span>
                          <span className="text-primary-600">
                            ₹{activeAction === 'deliver-fixed' ? settings.waterPrice : settings.waterPrice + settings.depositAmount}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Amount Paid (₹)</label>
                          <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:bg-white focus:border-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Method</label>
                          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:bg-white focus:border-primary-500 outline-none">
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank">Bank Transfer</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setActiveAction(null)} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-all">Cancel</button>
                        <button type="submit" disabled={loading} className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-xs disabled:opacity-50 transition-all shadow shadow-primary-50">
                          Confirm Delivery
                        </button>
                      </div>
                    </form>
                  )}

                  {/* CASE B: CAN IS WITH CUSTOMER -> RETURN CAN */}
                  {canData.can.status !== 'Available' && (
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      {/* Active Holder Profile */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Currently Assigned To:</span>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                            {canData.customer?.name?.substring(0, 2).toUpperCase() || 'CU'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-700 text-sm block leading-none">{canData.customer?.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{canData.customer?.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Alert about Refund */}
                      {canData.can.status === 'With Local Customer' && (
                        <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-xl text-accent-800 text-xs leading-normal flex items-start gap-2">
                          <FiCornerDownLeft className="mt-0.5 shrink-0" />
                          <span>
                            <strong>Refund Alert:</strong> Returning this local customer's can automatically records a deposit refund of <strong>₹{settings.depositAmount}</strong>.
                          </span>
                        </div>
                      )}

                      {/* Return Actions */}
                      <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={resetScanner} className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors">Rescan</button>
                        <button
                          onClick={handleReturnConfirm}
                          disabled={loading}
                          className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold text-xs disabled:opacity-50 transition-all shadow shadow-purple-50 flex items-center gap-1"
                        >
                          <FiCornerDownLeft size={13} />
                          Process Return Can
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer controls */}
        {scanResult && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
            <button
              onClick={resetScanner}
              className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 hover:underline"
            >
              Scan Another Can
            </button>
          </div>
        )}
      </motion.div>

      {/* Internal scanner lines animations style */}
      <style>{`
        @keyframes scan {
          0% { top: 1.5rem; }
          50% { top: calc(100% - 1.5rem); }
          100% { top: 1.5rem; }
        }
        .animate-scan-line {
          animation: scan 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default QRScannerModal;
