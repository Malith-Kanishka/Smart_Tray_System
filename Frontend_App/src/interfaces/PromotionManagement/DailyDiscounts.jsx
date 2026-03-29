import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Pause, Play } from 'lucide-react';

const DailyDiscounts = () => {
  const emptyFormData = { productName: "", originalPrice: "", discount: "", newPrice: "" };
  const [showModal, setShowModal] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [formError, setFormError] = useState("");

  const fetchDiscounts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/promotions/daily');
      if (!res.ok) {
        setDiscounts([]);
        return;
      }
      const data = await res.json();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load daily discounts:', error);
      setDiscounts([]);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/menu');
      if (!res.ok) {
        setMenuItems([]);
        return;
      }
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load menu items:', error);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscounts();
      fetchMenu();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleProductSelect = (name) => {
    const item = menuItems.find(m => m.name === name);
    if (item) {
      const orig = Number(item.price) || 0;
      const discountValue = Number(formData.discount) || 0;
      const newPrice = orig - (orig * (discountValue / 100));
      setFormData({ ...formData, productName: name, originalPrice: orig, newPrice: newPrice.toFixed(2) });
    }
  };

  const handleDiscountChange = (val) => {
    if (val === "") {
      const originalPrice = Number(formData.originalPrice) || 0;
      setFormData({ ...formData, discount: "", newPrice: originalPrice ? originalPrice.toFixed(2) : "" });
      return;
    }

    const disc = parseFloat(val);
    const originalPrice = Number(formData.originalPrice) || 0;
    const newPrice = originalPrice - (originalPrice * (disc / 100));
    setFormData({ ...formData, discount: val, newPrice: newPrice.toFixed(2) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const discountValue = Number(formData.discount);
    if (Number.isNaN(discountValue) || discountValue <= 0 || discountValue >= 100) {
      setFormError("Discount must be greater than 0 and less than 100.");
      return;
    }

    const endpoint = editingDiscountId
      ? `http://localhost:5000/api/promotions/daily/${editingDiscountId}`
      : 'http://localhost:5000/api/promotions/daily/add';
    const method = editingDiscountId ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, discount: discountValue })
    });

    if (res.ok) {
      closeModal();
      fetchDiscounts();
    } else {
      alert('Failed to save discount');
    }
  };

  const handleEdit = (discount) => {
    setEditingDiscountId(discount.discountID);
    setFormError("");
    setFormData({
      productName: discount.productName || "",
      originalPrice: Number(discount.originalPrice) || 0,
      discount: Number(discount.discount) || 0,
      newPrice: Number(discount.newPrice) || 0
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDiscountId(null);
    setFormError("");
    setFormData(emptyFormData);
  };

  const handlePauseResume = async (discount) => {
    const res = await fetch(`http://localhost:5000/api/promotions/daily/${discount.discountID}/pause`, { method: 'PUT' });
    if (res.ok) {
      fetchDiscounts();
    } else {
      alert('Failed to update discount status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this discount?')) return;
    const res = await fetch(`http://localhost:5000/api/promotions/daily/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchDiscounts();
    } else {
      alert('Failed to delete discount');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase">Daily Product Discounts</h2>
        <button onClick={() => { setEditingDiscountId(null); setFormData(emptyFormData); setFormError(""); setShowModal(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition shadow-lg">
          <Plus size={20}/> Create Discount
        </button>
      </div>

      <div className="bg-white rounded-[30px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-sm font-bold uppercase text-slate-900 tracking-widest">
            <tr>
              <th className="px-8 py-5 text-center">ID</th>
              <th className="px-8 py-5 text-center">Product</th>
              <th className="px-8 py-5 text-center">Original</th>
              <th className="px-8 py-5 text-center">Discount</th>
              <th className="px-8 py-5 text-center">New Price</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-base font-normal text-black">
            {discounts.map(d => (
              <tr key={d.discountID} className="hover:bg-slate-50/50 transition">
                <td className="px-8 py-5 font-bold text-black text-center">{d.discountID}</td>
                <td className="px-8 py-5 text-black text-center">{d.productName}</td>
                <td className="px-8 py-5 text-black text-center line-through">Rs. {d.originalPrice}</td>
                <td className="px-8 py-5 font-black text-red-500 text-center">-{d.discount}%</td>
                <td className="px-8 py-5 font-black text-green-600 text-center">Rs. {d.newPrice}</td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    String(d.status).toLowerCase() === 'active'
                      ? 'bg-green-50 text-green-600'
                      : String(d.status).toLowerCase() === 'paused'
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}>{d.status}</span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => handleEdit(d)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition"><Edit2 size={16}/></button>
                  <button
                    onClick={() => handlePauseResume(d)}
                    disabled={String(d.status).toLowerCase() === 'expired'}
                    title={String(d.status).toLowerCase() === 'paused' ? 'Resume discount' : 'Pause discount'}
                    className={`p-2 rounded-xl transition ${
                      String(d.status).toLowerCase() === 'paused'
                        ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white'
                        : 'bg-slate-50 text-slate-400 hover:bg-orange-400 hover:text-white'
                    }`}
                  >
                    {String(d.status).toLowerCase() === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                  <button onClick={() => handleDelete(d.discountID)} className="p-2 bg-slate-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm font-semibold text-slate-400">
                  No daily discounts available.
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
              <h3 className="text-2xl font-black text-slate-900 uppercase">{editingDiscountId ? 'Edit Daily Discount' : 'Create Daily Discount'}</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && <p className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{formError}</p>}
              <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={formData.productName} onChange={e => handleProductSelect(e.target.value)} required>
                <option value="">Select Product</option>
                {menuItems.map(m => <option key={m.menuID} value={m.name}>{m.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Current Price (Rs.)" className="w-full p-4 bg-slate-200 rounded-2xl outline-none border border-slate-100 placeholder:text-slate-400" value={formData.originalPrice} readOnly/>
                <input type="number" min="0.01" max="99.99" step="0.01" placeholder="Enter discount %" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border border-slate-100" value={formData.discount} onChange={e => handleDiscountChange(e.target.value)} required/>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase">Calculated New Price:</span>
                <span className="text-xl font-black text-blue-700">{formData.newPrice ? `Rs. ${formData.newPrice}` : 'Rs. --'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={closeModal} className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-300 transition">Close</button>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition">{editingDiscountId ? 'Update Discount' : 'Create Discount'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyDiscounts;