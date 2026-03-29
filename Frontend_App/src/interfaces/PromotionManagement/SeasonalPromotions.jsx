import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Pause, Play } from 'lucide-react';

const SeasonalPromotions = () => {
  const [showModal, setShowModal] = useState(false);
  const [promos, setPromos] = useState([]);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [formData, setFormData] = useState({ title: "", discount: "", startDate: "", endDate: "" });
  const [formError, setFormError] = useState("");

  const fetchPromos = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/promotions/seasonal');
      if (!res.ok) {
        setPromos([]);
        return;
      }
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load seasonal promotions:', error);
      setPromos([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPromos();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const discountValue = Number(formData.discount);
    if (Number.isNaN(discountValue) || discountValue <= 0 || discountValue >= 100) {
      setFormError("Discount must be greater than 0 and less than 100.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (!editingPromoId && formData.startDate < today) {
      setFormError("Start date must be in the future.");
      return;
    }
    if (formData.endDate <= formData.startDate) {
      setFormError("End date must be after start date.");
      return;
    }

    const endpoint = editingPromoId
      ? `http://localhost:5000/api/promotions/seasonal/${editingPromoId}`
      : 'http://localhost:5000/api/promotions/seasonal/add';

    const method = editingPromoId ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, discount: discountValue })
    });

    if (res.ok) {
      setShowModal(false);
      setEditingPromoId(null);
      setFormData({ title: "", discount: "", startDate: "", endDate: "" });
      setFormError("");
      fetchPromos();
    } else {
      alert('Failed to save promotion');
    }
  };

  const handleEdit = (promo) => {
    setEditingPromoId(promo.promoID);
    setFormError("");
    setFormData({
      title: promo.title || "",
      discount: promo.discount ?? "",
      startDate: String(promo.startDate || "").split('T')[0],
      endDate: String(promo.endDate || "").split('T')[0]
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPromoId(null);
    setFormError("");
    setFormData({ title: "", discount: "", startDate: "", endDate: "" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete promotion?")) {
      await fetch(`http://localhost:5000/api/promotions/seasonal/${id}`, { method: 'DELETE' });
      fetchPromos();
    }
  };

  const handlePauseResume = async (promo) => {
    const res = await fetch(`http://localhost:5000/api/promotions/seasonal/${promo.promoID}/pause`, { method: 'PUT' });
    if (res.ok) fetchPromos();
    else alert('Failed to update promotion status');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase">Seasonal Promotions</h2>
        <button onClick={() => { setEditingPromoId(null); setFormData({title:"", discount:"", startDate:"", endDate:""}); setFormError(""); setShowModal(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition shadow-lg">
          <Plus size={20}/> Create Promotion
        </button>
      </div>

      <div className="bg-white rounded-[30px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-sm font-bold uppercase text-slate-900 tracking-widest">
            <tr>
              <th className="px-8 py-5 text-center">ID</th>
              <th className="px-8 py-5 text-center">Title</th>
              <th className="px-8 py-5 text-center">Discount</th>
              <th className="px-8 py-5 text-center">Dates</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-base font-normal text-black">
            {promos.map(p => (
              <tr key={p.promoID} className="hover:bg-slate-50/50 transition">
                <td className="px-8 py-5 font-bold text-black text-center">{p.promoID}</td>
                <td className="px-8 py-5 text-black">{p.title}</td>
                <td className="px-8 py-5 font-black text-blue-600 text-center">{p.discount}%</td>
                <td className="px-8 py-5 text-black text-center">{p.startDate} — {p.endDate}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    p.status === 'active' ? 'bg-green-50 text-green-600' :
                    p.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                    p.status === 'paused' ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-100 text-slate-400'
                  }`}>{p.status}</span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => handleEdit(p)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition"><Edit2 size={16}/></button>
                  <button
                    onClick={() => handlePauseResume(p)}
                    disabled={p.status === 'scheduled' || p.status === 'expired'}
                    title={p.status === 'paused' ? 'Resume promotion' : 'Pause promotion'}
                    className={`p-2 rounded-xl transition disabled:opacity-30 ${
                      p.status === 'paused'
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white'
                        : 'bg-slate-50 text-slate-400 hover:bg-orange-400 hover:text-white'
                    }`}
                  >
                    {p.status === 'paused' ? <Play size={16}/> : <Pause size={16}/>}
                  </button>
                  <button onClick={() => handleDelete(p.promoID)} className="p-2 bg-slate-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {promos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm font-semibold text-slate-400">
                  No seasonal promotions available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase">{editingPromoId ? 'Edit Promotion' : 'Create Promotion'}</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{formError}</p>}
              <input type="text" placeholder="Promotion Title" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/>
              <input type="number" min="0.01" max="99.99" step="0.01" placeholder="Discount (%)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} required/>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Date</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required/></div>
                <div><label className="text-[10px] font-bold text-slate-400 uppercase ml-1">End Date</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={closeModal} className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-300 transition">Close</button>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition">{editingPromoId ? 'Update Promotion' : 'Create Promotion'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalPromotions;