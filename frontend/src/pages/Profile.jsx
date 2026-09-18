import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Address Form State
  const [addressData, setAddressData] = useState({
    phone_number: '',
    shipping_address: '',
    city: '',
    pincode: '',
  });

  // Password Form State
  const [passData, setPassData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('accounts/profile/');
      console.log('Profile data:', response.data);
      const data = response.data?.profile || response.data?.user || {};
      setProfile(data);
      setAddressData({
        phone_number: data.phone_number || '',
        shipping_address: data.shipping_address || '',
        city: data.city || '',
        pincode: data.pincode || '',
      });
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Unable to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMsg('');
    setError('');

    try {
      const response = await api.put('accounts/profile/', addressData);
      setMsg(response.data?.message || 'Delivery address saved successfully!');
      setTimeout(() => setMsg(''), 4000);
      fetchProfile();
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.confirm_password) {
      setError('New passwords do not match.');
      return;
    }

    setChangingPass(true);
    setMsg('');
    setError('');

    try {
      const response = await api.put('accounts/change-password/', passData);
      setMsg(response.data?.message || 'Password changed successfully!');
      setPassData({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      console.error('Change password error:', err);
      const data = err.response?.data;
      if (data?.old_password) {
        setError(data.old_password.join(', '));
      } else {
        setError(data?.message || 'Failed to change password.');
      }
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 font-bold animate-pulse">
        Loading user profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Profile 👤</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, saved shipping address, and password security.
          </p>
        </div>
      </div>

      {/* Messages */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-center animate-fadeIn shadow-sm">
          {msg}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-center animate-fadeIn shadow-sm">
          {error}
        </div>
      )}

      {/* User Info Overview Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-indigo-600/20">
          {(profile?.username || user?.username || 'U')[0].toUpperCase()}
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">{profile?.username || user?.username}</h2>
            <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              profile?.is_admin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {profile?.is_admin ? 'Administrator' : 'Customer Account'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">📧 {profile?.email || user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Saved Delivery Address Form */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Saved Delivery Address 🏠
          </h3>
          <p className="text-xs text-slate-500">
            Pre-fills automatically during checkout for fast ordering.
          </p>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                value={addressData.phone_number}
                onChange={(e) => setAddressData({ ...addressData, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Street Address</label>
              <textarea
                rows="2"
                value={addressData.shipping_address}
                onChange={(e) => setAddressData({ ...addressData, shipping_address: e.target.value })}
                placeholder="House No, Apartment, Street Details"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                <input
                  type="text"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pincode</label>
                <input
                  type="text"
                  value={addressData.pincode}
                  onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })}
                  placeholder="400001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              {savingProfile ? 'Saving Address...' : 'Save Delivery Address'}
            </button>
          </form>
        </div>

        {/* Change Password Security Form */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Change Password 🔒
          </h3>
          <p className="text-xs text-slate-500">
            Update your account password for enhanced security.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={passData.old_password}
                onChange={(e) => setPassData({ ...passData, old_password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password *</label>
              <input
                type="password"
                required
                value={passData.new_password}
                onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                placeholder="Min 8 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={passData.confirm_password}
                onChange={(e) => setPassData({ ...passData, confirm_password: e.target.value })}
                placeholder="Confirm new password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              {changingPass ? 'Updating Password...' : 'Update Security Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
