import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, RefreshCw, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    is_active: true,
    sort_order: 0,
  });

  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Auto-generate slug from name if user hasn't explicitly edited slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    if (!supabase) {
      showToast('Koneksi database tidak tersedia (Supabase belum dikonfigurasi).', 'error');
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          showToast('Tabel categories belum dibuat di Supabase', 'error');
        } else {
          throw error;
        }
      } else {
        setCategories(data || []);
      }
    } catch (err: any) {
      console.error('Fetch categories error:', err);
      showToast(`Gagal mengambil data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (!formData.name || !formData.slug) {
      showToast('Nama dan Slug tidak boleh kosong.', 'error');
      return;
    }

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            sort_order: Number(formData.sort_order)
          })
          .eq('id', editingId);

        if (error) throw error;
        showToast('Kategori berhasil diperbarui', 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            slug: formData.slug,
            is_active: formData.is_active,
            sort_order: Number(formData.sort_order)
          }]);

        if (error) throw error;
        showToast('Kategori baru berhasil ditambahkan', 'success');
      }

      resetForm();
      fetchCategories();
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(`Gagal menyimpan: ${err.message}`, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', is_active: true, sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      is_active: category.is_active,
      sort_order: category.sort_order
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!supabase) return;
    if (!window.confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Kategori berhasil dihapus', 'success');
      fetchCategories();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Gagal menghapus: ${err.message}`, 'error');
    }
  };

  const toggleStatus = async (category: Category) => {
    if (!supabase) return;
    
    // Optimistic UI update
    setCategories(prev => prev.map(c => 
      c.id === category.id ? { ...c, is_active: !c.is_active } : c
    ));
    
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);
        
      if (error) {
        // Revert on error
        setCategories(prev => prev.map(c => 
          c.id === category.id ? { ...c, is_active: category.is_active } : c
        ));
        throw error;
      }
    } catch (err: any) {
      console.error('Toggle error:', err);
      showToast(`Gagal mengubah status: ${err.message}`, 'error');
    }
  };

  return (
    <div className="bg-white border border-[#EBE3D5] rounded-3xl p-5 shadow-xs space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg border text-xs font-bold animate-fadeIn flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3.5 border-b border-[#FAF2E8] gap-3">
        <div>
          <h4 className="text-sm font-black text-[#1C1612] uppercase tracking-wider">
            Manajemen Kategori Menu
          </h4>
          <p className="text-[10.5px] text-[#9E8775] font-semibold mt-0.5">Kelola tipe dan grup sajian makanan miuman</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            className="p-2 bg-gray-50 text-[#8C6239] hover:bg-[#8C6239]/10 border border-gray-150 rounded-xl transition-all shadow-3xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!showForm && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#8C6239] hover:bg-[#724E2B] text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-4.5 mb-5 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-bold text-xs uppercase tracking-wider text-[#5B4E44]">
              {editingId ? 'Edit Kategori' : 'Kategori Baru'}
            </h5>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider">Nama Kategori</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className="w-full bg-white border border-[#EBE3D5] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2520] focus:ring-2 focus:ring-[#8C6239]/30 focus:border-[#8C6239] outline-none shadow-3xs transition-all"
                placeholder="Contoh: Kopi Susu"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider">Slug (Otomatis)</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full bg-gray-50 border border-[#EBE3D5] rounded-xl px-3 py-2 text-xs font-mono text-gray-500 focus:ring-2 focus:ring-[#8C6239]/30 focus:border-[#8C6239] outline-none shadow-3xs transition-all"
                placeholder="kopi-susu"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider">Urutan (Sort Order)</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                className="w-full bg-white border border-[#EBE3D5] rounded-xl px-3 py-2 text-xs font-bold text-[#2C2520] focus:ring-2 focus:ring-[#8C6239]/30 focus:border-[#8C6239] outline-none shadow-3xs transition-all"
                min="0"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-[#8C6239] rounded focus:ring-[#8C6239]"
                />
                <span className="text-xs font-bold text-[#2C2520]">Aktif / Ditampilkan</span>
              </label>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white text-gray-500 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-700 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Kategori</span>
            </button>
          </div>
        </form>
      )}

      {/* Table Section */}
      <div className="overflow-x-auto rounded-2xl border border-[#FAF2E8]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#FAF2E8] text-[#5B4E44] font-black uppercase text-[9.5px] tracking-wider">
              <th className="p-4 text-center w-16">Urutan</th>
              <th className="p-4">Nama (Slug)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center w-32">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FAF8F5]">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-semibold italic">Memuat kategori...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-semibold italic">Belum ada data kategori.</td></tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-all font-medium text-[#2C2520]">
                  <td className="p-4 text-center font-mono font-bold text-[#8C6239]">
                    {cat.sort_order}
                  </td>
                  <td className="p-4">
                    <p className="font-extrabold text-[#1C1612] text-sm">{cat.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono tracking-tight">{cat.slug}</p>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleStatus(cat)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors border ${
                        cat.is_active 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' 
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {cat.is_active ? 'Tersedia' : 'Disembunyikan'}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-transparent hover:border-blue-200 rounded-lg transition-all"
                        title="Edit Kategori"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-lg transition-all"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
