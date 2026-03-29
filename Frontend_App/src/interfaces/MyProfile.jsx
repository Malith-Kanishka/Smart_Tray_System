import React, { useEffect, useState } from 'react';
import { ChevronDown, Edit3, Lock, Save, User, X } from 'lucide-react';

const MyProfile = ({ user, onRefresh }) => {
  const normalizedUser = {
    ...user,
    staff_id: user?.staff_id || "",
    staff_name: user?.staff_name || user?.fullName || user?.username || "-",
    nic: user?.nic || "-",
    email: user?.email || "-",
    phone: user?.phone || "-",
    address: user?.address || "-",
    dob: user?.dob || "",
    role: user?.role || "-",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [displayUser, setDisplayUser] = useState({ ...normalizedUser });
  const [profileData, setProfileData] = useState({ ...normalizedUser });
  const [error, setError] = useState("");

  useEffect(() => {
    setDisplayUser({ ...normalizedUser });
    setProfileData({ ...normalizedUser });
  }, [user]);

  const profileFields = [
    { label: 'ID', value: displayUser.staff_id || '-' },
    { label: 'Full Name', value: displayUser.staff_name || '-' },
    { label: 'NIC', value: displayUser.nic || '-' },
    { label: 'Email', value: displayUser.email || '-' },
    { label: 'Phone', value: displayUser.phone || '-' },
    { label: 'Address', value: displayUser.address || '-' },
    { label: 'Date of Birth', value: displayUser.dob || '-' },
    { label: 'Role', value: displayUser.role || '-' },
  ];

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!normalizedUser.staff_id) {
      alert("Staff ID not found. Please log in again.");
      return;
    }

    const payload = {
      staff_name: profileData.staff_name,
      nic: profileData.nic,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
      dob: profileData.dob,
      role: profileData.role,
    };

    const res = await fetch(`http://localhost:5000/api/staff/update/${normalizedUser.staff_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setIsEditing(false);
      const updatedUser = { ...displayUser, ...payload, staff_id: normalizedUser.staff_id };
      setDisplayUser(updatedUser);
      setProfileData(updatedUser);
      if (typeof onRefresh === 'function') {
        onRefresh(updatedUser);
      }
      alert("Profile updated successfully!");
    } else {
      const data = await res.json();
      alert(data.detail || "Failed to update profile");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError("");
    if (passData.new !== passData.confirm) return setError("Passwords don't match");

    const res = await fetch('http://localhost:5000/api/staff/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_id: normalizedUser.staff_id,
        current_password: passData.current,
        new_password: passData.new
      })
    });
    if (res.ok) {
      setShowPassModal(false);
      alert("Password updated!");
    } else {
      const data = await res.json();
      setError(data.detail);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="h-32 bg-slate-900 flex items-end px-8 pb-5 relative">
          <div className="absolute right-8 bottom-5 flex gap-3">
              <button onClick={() => { setProfileData({ ...normalizedUser }); setIsEditing(true); }} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition">
               <Edit3 size={18}/> Edit Profile
             </button>
             <button onClick={() => setShowPassModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition">
               <Lock size={18}/> Change Password
             </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
              {displayUser.staff_id}
            </div>
            <div>
              <h2 className="text-white font-black text-2xl uppercase tracking-tight">{displayUser.staff_name}</h2>
              <p className="text-slate-300 font-bold text-sm uppercase tracking-widest">{displayUser.role}</p>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-2 gap-4">
          {profileFields.map((field) => (
            <div key={field.label} className={`bg-slate-50 rounded-2xl p-4 ${field.label === 'Address' ? 'col-span-2' : ''}`}>
              <p className="text-sm font-black text-slate-500 uppercase tracking-wider">{field.label}</p>
              <p className="text-lg text-black font-normal mt-1.5 wrap-break-word">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-4xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-2xl text-slate-900 uppercase font-bold">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-base text-black block mb-1">Full Name</label>
                  <input type="text" value={profileData.staff_name || ''} className="w-full mt-1 p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-base" onChange={e => setProfileData({ ...profileData, staff_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-base text-black block mb-1">NIC</label>
                  <input type="text" value={profileData.nic || ''} className="w-full mt-1 p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-base" onChange={e => setProfileData({ ...profileData, nic: e.target.value })} />
                </div>
                <div>
                  <label className="text-base text-black block mb-1">Phone</label>
                  <input type="text" value={profileData.phone || ''} className="w-full mt-1 p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-base" onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-base text-black block mb-1">Email</label>
                  <input type="email" value={profileData.email || ''} className="w-full mt-1 p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-base" onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-base text-black block mb-1">Address</label>
                  <input type="text" value={profileData.address || ''} className="w-full mt-1 p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-base" onChange={e => setProfileData({ ...profileData, address: e.target.value })} />
                </div>
                <div>
                  <label className="text-base text-black block mb-1">Date of Birth</label>
                  <input type="date" value={profileData.dob || ''} className="w-full mt-1 p-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-base" onChange={e => setProfileData({ ...profileData, dob: e.target.value })} />
                </div>
                <div className="relative">
                  <label className="text-base text-black block mb-1">System Role</label>
                  <select value={profileData.role || ''} className="w-full p-3 bg-slate-100 border border-slate-100 rounded-2xl outline-none text-slate-700 appearance-none text-base" disabled>
                    <option value="system admin">System Admin</option>
                    <option value="food master">Food Master</option>
                    <option value="inventory controller">Inventory Controller</option>
                    <option value="promotion manager">Promotion Manager</option>
                    <option value="order manager">Order Manager</option>
                    <option value="finance officer">Finance Officer</option>
                  </select>
                  <ChevronDown className="absolute right-3 bottom-4 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase tracking-widest mt-4 hover:bg-blue-600 transition flex items-center justify-center gap-3">
                <Save size={20}/> Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {showPassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handlePasswordUpdate} className="bg-white w-full max-w-sm rounded-4xl p-6 space-y-3 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black uppercase text-slate-800">Change Password</h3>
            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl text-center">{error}</p>}
            
            <div className="space-y-3">
               <input type="password" placeholder="Current Password" required className="w-full p-3 bg-slate-50 rounded-2xl outline-none text-base" onChange={e => setPassData({...passData, current: e.target.value})} />
               <input type="password" placeholder="New Password (8+ chars, @ symbol)" required className="w-full p-3 bg-slate-50 rounded-2xl outline-none text-base" onChange={e => setPassData({...passData, new: e.target.value})} />
               <input type="password" placeholder="Confirm New Password" required className="w-full p-3 bg-slate-50 rounded-2xl outline-none text-base" onChange={e => setPassData({...passData, confirm: e.target.value})} />
            </div>
            
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition shadow-lg">Update Password</button>
            <button type="button" onClick={() => setShowPassModal(false)} className="w-full text-slate-400 font-bold text-sm">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyProfile;