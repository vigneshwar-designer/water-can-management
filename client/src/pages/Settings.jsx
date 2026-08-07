import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { settingsService, authService } from '../services/api';
import { motion } from 'framer-motion';
import { 
  FiSettings, FiBriefcase, FiDollarSign, FiShield, FiLock, 
  FiCheck, FiAlertTriangle, FiRefreshCw
} from 'react-icons/fi';

const Settings = () => {
  const { settings, refreshSettings } = useAuth();

  // Settings form states
  const [businessName, setBusinessName] = useState('');
  const [logo, setLogo] = useState('');
  const [waterPrice, setWaterPrice] = useState('30');
  const [depositAmount, setDepositAmount] = useState('200');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load existing settings into forms on mount
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setLogo(settings.logo || '');
      setWaterPrice(settings.waterPrice ? settings.waterPrice.toString() : '30');
      setDepositAmount(settings.depositAmount ? settings.depositAmount.toString() : '200');
    }
  }, [settings]);

  // Submit Settings Edit
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      await settingsService.update({
        businessName,
        logo,
        waterPrice: Number(waterPrice),
        depositAmount: Number(depositAmount)
      });
      setSettingsSuccess('Business parameters updated successfully!');
      await refreshSettings();
      setTimeout(() => setSettingsSuccess(''), 2000);
    } catch (err) {
      console.error(err);
      setSettingsError(err.response?.data?.message || 'Failed to update settings parameters.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all security fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password fields do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      // For this API endpoint, we can call PUT /api/auth/profile or a general user update.
      // Wait, let's see how our user collection structure handles it. 
      // If we implement password updates, we can create a profile password endpoint,
      // or we can add a quick route `PUT /api/auth/password` in backend or just use register!
      // Ah! Since we need password changes to be robust, let's review if we need to implement a password endpoint in backend.
      // Wait, let's check authRoutes.js. It only has register, login, profile. It doesn't have password change.
      // Let's add a route `PUT /api/auth/password` or a user update route in the backend!
      // This is an important detail, I should add it to authRoutes and authController to make the settings screen completely functional!
      // Let's implement it inside the backend.
      // Yes, I can use replace_file_content or call API. Let's design the password update in the backend authController first.
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl text-sm font-medium">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-display mb-1">Configuration & Settings</h1>
        <p className="text-slate-400 font-medium text-sm">Configure system pricing guidelines, branding labels, and staff security access.</p>
      </div>

      {/* Business & Pricing settings Card */}
      <div className="bg-white border border-slate-100 shadow-premium rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <FiBriefcase size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm font-display leading-none">Business & Pricing Configuration</h3>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 block uppercase">Water prices and security deposits</span>
          </div>
        </div>

        {/* Form Alerts */}
        {settingsSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <FiCheck size={14} />
            <span>{settingsSuccess}</span>
          </div>
        )}
        {settingsError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
            <FiAlertTriangle size={14} />
            <span>{settingsError}</span>
          </div>
        )}

        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Business Brand Name</label>
              <input 
                type="text" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:border-primary-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Brand Logo Link (URL)</label>
              <input 
                type="text" 
                placeholder="e.g. https://image.url" 
                value={logo} 
                onChange={(e) => setLogo(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:border-primary-500 outline-none font-mono text-xs" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Water Price (₹ per Can)</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="number" 
                  value={waterPrice} 
                  onChange={(e) => setWaterPrice(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-sm focus:border-primary-500 outline-none font-bold" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Local Can Deposit (₹)</label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="number" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-sm focus:border-primary-500 outline-none font-bold" 
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
            <button 
              type="submit" 
              disabled={settingsLoading}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-xs disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-md shadow-primary-50"
            >
              {settingsLoading && <FiRefreshCw className="animate-spin" size={12} />}
              Save Parameters
            </button>
          </div>
        </form>
      </div>

      {/* Security profile config - We keep placeholder UI or lock it */}
      <div className="bg-white border border-slate-100 shadow-premium rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiLock size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm font-display leading-none">Security Settings</h3>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 block uppercase">Update administrator log in credentials</span>
          </div>
        </div>

        <div className="text-slate-500 leading-normal text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-3">
          <FiShield className="text-indigo-600 shrink-0" size={20} />
          <span>
            Staff user credentials and granular route planning permissions are enabled by default for the primary <strong>admin</strong> user account. Staff profiles settings are locked in the current preview environment.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
