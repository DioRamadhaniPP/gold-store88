'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Settings, 
  LogOut, Plus, Search, Trash2, CreditCard, Banknote, 
  Wallet, TrendingUp, TrendingDown, DollarSign, Box, Activity, ChevronRight, 
  CheckCircle2, AlertCircle, Store, FileText, ArrowUpRight, 
  ArrowDownRight, Calendar, Loader2, Database, Edit, Edit2, Printer,
  RefreshCcw, Scale, MapPin, Landmark, ArrowUpCircle, ArrowDownCircle, Download,
  Menu, X, ArrowRightLeft, History
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ============================================================================
// 1. SUPABASE REST API CLIENT (NATIVE FETCH)
// ============================================================================
let ENV_URL = '';
let ENV_KEY = '';
try {
  if (typeof process !== 'undefined' && process.env) {
    ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }
} catch(e) {}

let envUrl = ENV_URL || 'https://fpbfjsavrfrdqclbqdtv.supabase.co';
if (envUrl && envUrl.includes('/rest/v1')) {
  envUrl = envUrl.replace(/\/rest\/v1\/?$/, '');
}

const SUPABASE_URL = `${envUrl}/rest/v1`;
const SUPABASE_ANON_KEY = ENV_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYmZqc2F2cmZyZHFjbGJxZHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjAxNTIsImV4cCI6MjA5NDQzNjE1Mn0.ALOE1piGMdiG0g7hAIo4HXHM6f3pGv_uDjAu4pvqhB8';

const sbFetch = async (endpoint, options = {}) => {
  const isDelete = options.method === 'DELETE';
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(isDelete ? {} : { 'Prefer': 'return=representation' }), 
      ...(options.headers || {})
    }
  });
  
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch(e){}
  
  if (!res.ok) throw new Error((data && data.message) || 'Request ke Supabase gagal');
  return data;
};

// ============================================================================
// 2. UTILITY FUNCTIONS
// ============================================================================
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

const parseSupabaseDate = (isoString) => {
  if (!isoString) return new Date();
  let safeString = isoString;
  if (!safeString.endsWith('Z') && !safeString.includes('+')) {
    safeString += 'Z';
  }
  return new Date(safeString);
};

const formatDate = (isoString) => {
  if (!isoString) return '-';
  const date = parseSupabaseDate(isoString);
  return new Intl.DateTimeFormat('id-ID', { 
    day: '2-digit', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Jakarta' 
  }).format(date) + ' WIB';
};

const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
        cell = cell.replace(/"/g, '""'); 
        return `"${cell}"`; 
      }).join(separator);
    }).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// ============================================================================
// 3. UI COMPONENTS
// ============================================================================
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', isLoading = false, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none px-4 py-2 text-sm";
  const variants = {
    primary: "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    ghost: "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
      {children}
    </button>
  );
};

const Input = ({ className = '', ...props }) => (
  <input 
    className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
    {...props}
  />
);

const Toast = ({ message, type = 'success' }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-4 right-4 z-[999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-5 ${type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}>
      {type === 'success' ? <CheckCircle2 size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[color]}`}>{children}</span>;
};

// ============================================================================
// 4. VIEWS
// ============================================================================

// --- LOGIN VIEW ---
const LoginView = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const diagnosticData = await sbFetch('/users?select=username,role&limit=10');
      
      if (!diagnosticData || diagnosticData.length === 0) {
        setError('Tabel "users" KOSONG atau RLS masih AKTIF. Silakan isi data di Supabase Anda.');
        setIsLoading(false);
        return;
      }

      const encodedUsername = encodeURIComponent(username);
      const encodedPassword = encodeURIComponent(password);
      const data = await sbFetch(`/users?username=eq.${encodedUsername}&password=eq.${encodedPassword}&select=*`);
      
      if (!data || data.length === 0) {
        const availableUsers = diagnosticData.map(u => u.username).join(', ');
        setError(`Password salah. Username yang ada di DB: [ ${availableUsers} ].`);
      } else {
        const loggedUser = data[0];
        
        if (loggedUser.cabang_id) {
          const cabangData = await sbFetch(`/cabang?id=eq.${loggedUser.cabang_id}&select=*`);
          if (cabangData && cabangData.length > 0) {
            loggedUser.cabang_nama = cabangData[0].nama_cabang;
            loggedUser.cabang_alamat = cabangData[0].alamat;
          } else {
            loggedUser.cabang_nama = 'Cabang Tidak Ditemukan';
          }
        } else {
          loggedUser.cabang_nama = 'Pusat / Semua Cabang'; 
        }

        onLogin(loggedUser); 
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(`Error Koneksi API: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-amber-100 selection:text-amber-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/50 via-slate-50 to-slate-50"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-lg shadow-amber-400/30 mb-4 text-white">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          </div>
          <h1 className="text-4xl font-serif font-bold text-slate-800 mb-2">88 GoldJewellery</h1>
          <p className="text-amber-600 text-sm tracking-widest uppercase font-semibold">Live System</p>
        </div>

        <Card className="p-8 shadow-xl shadow-slate-200/50 border-white">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold"><AlertCircle size={18}/> Gagal Login</div>
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <Input type="text" placeholder="Masukkan username Supabase" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" disabled={isLoading}/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}/>
            </div>
            <Button type="submit" className="w-full h-11 text-base mt-4 font-bold" isLoading={isLoading}>
              Masuk Sistem
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

// --- ADMIN DASHBOARD VIEW ---
const AdminDashboard = ({ db }) => {
  const totalPendapatan = db.transaksi.reduce((sum, tx) => sum + Number(tx.total_bayar), 0);
  const totalLaba = db.laporan_laba.reduce((sum, laba) => sum + Number(laba.laba), 0);
  const totalStok = db.produk_emas.reduce((sum, p) => sum + Number(p.stok), 0);

  const chartData = [
    { name: 'Sen', penjualan: 40, laba: 4.5 },
    { name: 'Sel', penjualan: 30, laba: 3.2 },
    { name: 'Rab', penjualan: 20, laba: 2.1 },
    { name: 'Kam', penjualan: 55, laba: 6.8 },
    { name: 'Jum', penjualan: Math.floor(totalPendapatan / 1000000) || 48, laba: Math.floor(totalLaba / 1000000) || 5.4 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Admin</h2>
          <p className="text-sm text-slate-500">Ringkasan performa 88 GoldJewellery (Realtime Database).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Pendapatan', value: formatRupiah(totalPendapatan), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
          { title: 'Total Laba', value: formatRupiah(totalLaba), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
          { title: 'Transaksi Berhasil', value: db.transaksi.length.toString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Total Produk (Stok)', value: `${totalStok} pcs`, icon: Box, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar size={18} className="text-amber-500"/> Grafik Penjualan (Juta Rupiah)
          </h3>
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b'}} />
                <Bar dataKey="penjualan" name="Penjualan" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="laba" name="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
            Produk di Database
            <Database size={16} className="text-slate-400"/>
          </h3>
          <div className="space-y-4">
            {db.produk_emas.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold border border-amber-200 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.nama_produk}</p>
                  <p className="text-xs text-slate-500">{p.kadar || '-'} • {p.berat}g</p>
                </div>
                <div className={`text-sm font-bold ${p.stok > 0 ? 'text-green-600' : 'text-red-500'} bg-slate-50 px-2 py-1 rounded shrink-0`}>
                  {p.stok} stok
                </div>
              </div>
            ))}
            {db.produk_emas.length === 0 && <p className="text-slate-500 text-sm">Belum ada produk di database.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- ADMIN KEUANGAN VIEW ---
const AdminKeuangan = ({ db, refreshDb, setToast, user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ tipe: 'pengeluaran', kategori: 'Operasional', nominal: '', keterangan: '' });
  const [filterType, setFilterType] = useState('semua');

  const now = new Date();
  const currentWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [currYear, currMonth] = currentWIB.split('-');

  let displayData = db.keuangan || [];

  if (user.role !== 'admin') {
    displayData = displayData.filter(k => k.user_id === user.id);
  }

  if (filterType === 'harian') {
    displayData = displayData.filter(k => {
      if (!k.created_at) return false;
      const kWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(k.created_at));
      return kWIB === currentWIB;
    });
  } else if (filterType === 'bulanan') {
    displayData = displayData.filter(k => {
      if (!k.created_at) return false;
      const kWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(k.created_at));
      return kWIB.startsWith(`${currYear}-${currMonth}`);
    });
  } else if (filterType === 'tahunan') {
    displayData = displayData.filter(k => {
      if (!k.created_at) return false;
      const kWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(k.created_at));
      return kWIB.startsWith(`${currYear}`);
    });
  }

  const totalPemasukan = displayData.filter(k => k.tipe === 'pemasukan').reduce((acc, curr) => acc + parseFloat(curr.nominal), 0);
  const totalPengeluaran = displayData.filter(k => k.tipe === 'pengeluaran').reduce((acc, curr) => acc + parseFloat(curr.nominal), 0);
  const saldoKas = totalPemasukan - totalPengeluaran;

  const handleExport = () => {
    const exportData = displayData.map(k => ({
      'Waktu (WIB)': formatDate(k.created_at),
      'Tipe Arus Kas': k.tipe.toUpperCase(),
      'Kategori': k.kategori,
      'Keterangan': k.keterangan || '-',
      'Debit (Masuk)': k.tipe === 'pemasukan' ? k.nominal : 0,
      'Kredit (Keluar)': k.tipe === 'pengeluaran' ? k.nominal : 0
    }));
    exportToCSV(`Laporan_Buku_Kas_${filterType}_${Date.now()}.csv`, exportData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sbFetch('/keuangan', {
        method: 'POST',
        body: JSON.stringify({
          cabang_id: user.cabang_id,
          user_id: user.id,
          tipe: formData.tipe,
          kategori: formData.kategori,
          nominal: parseFloat(formData.nominal),
          keterangan: formData.keterangan || '-',
          created_at: new Date().toISOString()
        })
      });
      
      setToast({ message: 'Data kas berhasil ditambahkan!', type: 'success' });
      setIsModalOpen(false);
      setFormData({ tipe: 'pengeluaran', kategori: 'Operasional', nominal: '', keterangan: '' });
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan kas ini?')) return;
    try {
      await sbFetch(`/keuangan?id=eq.${id}`, { method: 'DELETE' });
      setToast({ message: 'Catatan kas dihapus.', type: 'success' });
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Buku Kas (Arus Keuangan)</h2>
          <p className="text-sm text-slate-500">Pencatatan manual untuk pemasukan atau pengeluaran operasional.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
            <button onClick={() => setFilterType('harian')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'harian' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Harian</button>
            <button onClick={() => setFilterType('bulanan')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'bulanan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Bulanan</button>
            <button onClick={() => setFilterType('semua')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'semua' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Semua</button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none"><Download size={16} className="mr-2"/> Export</Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none"><Plus size={16} className="mr-2"/> Tambah</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 border-green-200 bg-green-50/30">
          <p className="text-sm font-semibold text-green-700">Total Pemasukan</p>
          <h3 className="text-2xl font-bold text-green-700 mt-1">{formatRupiah(totalPemasukan)}</h3>
        </Card>
        <Card className="p-5 border-red-200 bg-red-50/30">
          <p className="text-sm font-semibold text-red-700">Total Pengeluaran</p>
          <h3 className="text-2xl font-bold text-red-700 mt-1">{formatRupiah(totalPengeluaran)}</h3>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50/30 shadow-md shadow-amber-500/10">
          <p className="text-sm font-semibold text-amber-700">Saldo Kas Bersih</p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">{formatRupiah(saldoKas)}</h3>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold">Waktu</th>
                <th className="px-6 py-4 font-bold">Tipe & Kategori</th>
                <th className="px-6 py-4 font-bold">Keterangan</th>
                <th className="px-6 py-4 font-bold">Pemasukan</th>
                <th className="px-6 py-4 font-bold">Pengeluaran</th>
                {user.role === 'admin' && <th className="px-6 py-4 font-bold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 && <tr><td colSpan="6" className="text-center py-6 text-slate-500">Tidak ada catatan kas.</td></tr>}
              {displayData.map((k) => (
                <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(k.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1 font-bold ${k.tipe === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                      {k.tipe === 'pemasukan' ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>}
                      {k.tipe.toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 uppercase">{k.kategori}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={k.keterangan}>{k.keterangan}</td>
                  <td className="px-6 py-4 font-bold text-green-600 whitespace-nowrap">{k.tipe === 'pemasukan' ? formatRupiah(k.nominal) : '-'}</td>
                  <td className="px-6 py-4 font-bold text-red-600 whitespace-nowrap">{k.tipe === 'pengeluaran' ? formatRupiah(k.nominal) : '-'}</td>
                  {user.role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      <Button variant="danger" className="px-2 py-1 h-auto text-xs" onClick={() => handleDelete(k.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah Kas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Input Data Keuangan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tipe Arus Kas</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})}>
                    <option value="pemasukan">Pemasukan (+)</option>
                    <option value="pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})}>
                    <option value="Operasional">Operasional (Listrik, dll)</option>
                    <option value="Gaji Karyawan">Gaji Karyawan</option>
                    <option value="Tambahan Modal">Tambahan Modal</option>
                    <option value="Lain-lain">Lain-lain</option>
                    <option value="Penjualan Emas">Penjualan Emas</option>
                    <option value="Buyback Perhiasan">Buyback Perhiasan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Nominal (Rp)</label>
                <Input required type="number" min="0" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})} placeholder="Cth: 150000" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Keterangan / Deskripsi</label>
                <textarea required rows={3} value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: Beli token listrik bulan ini..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" isLoading={isSubmitting}>Simpan Kas</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- ADMIN USERS VIEW (CRUD) ---
const AdminUsers = ({ db, refreshDb, setToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nama: '', username: '', password: '', role: 'kasir', cabang_id: '' });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama: '', username: '', password: '', role: 'kasir', cabang_id: db.cabang[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingId(u.id);
    setFormData({ nama: u.nama, username: u.username, password: '', role: u.role, cabang_id: u.cabang_id || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await sbFetch(`/users?id=eq.${id}`, { method: 'DELETE' });
      setToast({ message: 'User berhasil dihapus!', type: 'success' });
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, cabang_id: formData.cabang_id || null };
      if (editingId) {
        if (!payload.password) delete payload.password; 
        await sbFetch(`/users?id=eq.${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setToast({ message: 'Data user berhasil diperbarui!', type: 'success' });
      } else {
        if (!payload.password) throw new Error("Password wajib diisi untuk user baru");
        payload.created_at = new Date().toISOString();
        await sbFetch('/users', { method: 'POST', body: JSON.stringify(payload) });
        setToast({ message: 'User baru ditambahkan!', type: 'success' });
      }
      setIsModalOpen(false);
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen User</h2>
          <p className="text-sm text-slate-500">Kelola akses akun Admin dan Kasir.</p>
        </div>
        <Button onClick={openAddModal}><Plus size={16} className="mr-2"/> Tambah User</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr><th className="px-6 py-4 font-bold">Nama Lengkap</th><th className="px-6 py-4 font-bold">Username</th><th className="px-6 py-4 font-bold">Role / Cabang</th><th className="px-6 py-4 font-bold text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {db.users.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-slate-500">Tidak ada data.</td></tr>}
              {db.users.map((u) => {
                const cabang = db.cabang.find(c => c.id === u.cabang_id);
                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{u.nama}</td>
                    <td className="px-6 py-4 text-slate-600">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                      <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">{cabang ? cabang.nama_cabang : 'Pusat / Semua'}</div>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="secondary" className="px-2 py-1 h-auto" onClick={() => openEditModal(u)}><Edit size={14} /></Button>
                      <Button variant="danger" className="px-2 py-1 h-auto" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal CRUD User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Data User' : 'Tambah User Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
                <Input required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} placeholder="Cth: Kasir Satu" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Username</label>
                <Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Cth: kasir1" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Password {editingId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                <Input type="password" required={!editingId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Role Akun</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Penempatan Cabang</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.cabang_id} onChange={e => setFormData({...formData, cabang_id: e.target.value})}>
                    <option value="">-- Pusat / Semua --</option>
                    {db.cabang.map(c => <option key={c.id} value={c.id}>{c.nama_cabang}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" isLoading={isSubmitting}>Simpan User</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- ADMIN CABANG VIEW (CRUD) ---
const AdminCabang = ({ db, refreshDb, setToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nama_cabang: '', alamat: '' });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama_cabang: '', alamat: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setFormData({ nama_cabang: c.nama_cabang, alamat: c.alamat || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await sbFetch(`/cabang?id=eq.${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
        setToast({ message: 'Data cabang berhasil diperbarui!', type: 'success' });
      } else {
        await sbFetch('/cabang', {
          method: 'POST',
          body: JSON.stringify({ ...formData, created_at: new Date().toISOString() })
        });
        setToast({ message: 'Cabang berhasil ditambahkan!', type: 'success' });
      }
      setIsModalOpen(false);
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus cabang ini?')) return;
    try {
      await sbFetch(`/cabang?id=eq.${id}`, { method: 'DELETE' });
      setToast({ message: 'Cabang berhasil dihapus!', type: 'success' });
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Kelola Cabang</h2>
          <p className="text-sm text-slate-500">Manajemen data cabang (CRUD Terhubung Database).</p>
        </div>
        <Button onClick={openAddModal}><Plus size={16} className="mr-2"/> Tambah Cabang</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr><th className="px-6 py-4 font-bold">Nama Cabang</th><th className="px-6 py-4 font-bold">Alamat Lengkap</th><th className="px-6 py-4 font-bold text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {db.cabang.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-slate-500">Tidak ada cabang.</td></tr>}
              {db.cabang.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{c.nama_cabang}</td>
                  <td className="px-6 py-4 text-slate-600">{c.alamat}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs" onClick={() => openEditModal(c)}>
                      <Edit size={14} className="mr-1" /> Edit
                    </Button>
                    <Button variant="danger" className="px-3 py-1.5 h-auto text-xs" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} className="mr-1" /> Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah/Edit Cabang */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{editingId ? 'Edit Data Cabang' : 'Tambah Cabang Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Cabang</label>
                <Input required value={formData.nama_cabang} onChange={e => setFormData({...formData, nama_cabang: e.target.value})} placeholder="Cth: Cabang Pusat" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea required rows={3} value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Masukkan alamat lengkap..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" isLoading={isSubmitting}>Simpan Data</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- ADMIN PRODUCTS VIEW (CRUD LENGKAP) ---
const AdminProducts = ({ db, refreshDb, setToast, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama_produk: '', kategori_id: '', kadar: '', berat: '', harga_beli: '', harga_jual: '', stok: ''
  });

  const filteredProducts = db.produk_emas.filter(p => p.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase()));

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nama_produk: '', kategori_id: db.kategori_emas[0]?.id || '', kadar: '', berat: '', harga_beli: '', harga_jual: '', stok: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setFormData({ nama_produk: p.nama_produk, kategori_id: p.kategori_id || '', kadar: p.kadar || '', berat: p.berat || '', harga_beli: p.harga_beli || '', harga_jual: p.harga_jual || '', stok: p.stok || '0' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini secara permanen?')) return;
    try {
      // Hapus riwayat di inventory terlebih dahulu (menghindari error FK)
      await sbFetch(`/inventory_emas?produk_id=eq.${id}`, { method: 'DELETE' });
      await sbFetch(`/produk_emas?id=eq.${id}`, { method: 'DELETE' });
      setToast({ message: 'Produk berhasil dihapus!', type: 'success' });
      refreshDb();
    } catch (err) {
      setToast({ message: `Gagal menghapus produk: ${err.message}. Pastikan produk ini belum ditransaksikan.`, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      nama_produk: formData.nama_produk,
      kategori_id: formData.kategori_id || null,
      kadar: formData.kadar,
      berat: parseFloat(formData.berat),
      harga_beli: parseFloat(formData.harga_beli),
      harga_jual: parseFloat(formData.harga_jual),
      stok: parseInt(formData.stok, 10)
    };

    try {
      if (editingId) {
        await sbFetch(`/produk_emas?id=eq.${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setToast({ message: 'Produk berhasil diperbarui!', type: 'success' });
      } else {
        payload.created_at = new Date().toISOString();
        const res = await sbFetch('/produk_emas', { method: 'POST', body: JSON.stringify(payload) });
        setToast({ message: 'Produk baru ditambahkan!', type: 'success' });
        
        let newProduct = null;
        if (Array.isArray(res) && res.length > 0) newProduct = res[0];
        else if (res && res.id) newProduct = res;

        // Otomatis Tambah ke Inventory
        if (newProduct && newProduct.id && payload.stok > 0) {
          await sbFetch('/inventory_emas', {
            method: 'POST',
            body: JSON.stringify({
              produk_id: newProduct.id,
              user_id: user.id,
              tipe: 'masuk',
              jumlah: payload.stok,
              keterangan: 'Stok awal penambahan produk baru',
              created_at: new Date().toISOString()
            })
          });
        }
      }
      setIsModalOpen(false);
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Katalog Emas</h2>
          <p className="text-sm text-slate-500">Manajemen harga harian dan informasi produk (CRUD Aktif).</p>
        </div>
        <Button onClick={openAddModal}><Plus size={16} className="mr-2"/> Tambah Produk</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Cari produk..." className="pl-10 bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left bg-white min-w-[700px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr><th className="px-6 py-4">Nama Produk</th><th className="px-6 py-4">Kadar</th><th className="px-6 py-4">Berat</th><th className="px-6 py-4">Hrg Beli</th><th className="px-6 py-4">Hrg Jual</th><th className="px-6 py-4">Stok</th><th className="px-6 py-4 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && <tr><td colSpan="7" className="text-center py-4 text-slate-500">Tidak ada produk.</td></tr>}
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{p.nama_produk}</td>
                  <td className="px-6 py-4 font-bold text-amber-600">{p.kadar || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{p.berat}g</td>
                  <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatRupiah(p.harga_beli)}</td>
                  <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">{formatRupiah(p.harga_jual)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${p.stok > 5 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{p.stok} pcs</span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <Button variant="secondary" className="px-2 py-1 h-auto" onClick={() => openEditModal(p)}><Edit size={14} /></Button>
                    <Button variant="danger" className="px-2 py-1 h-auto" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal CRUD Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 shadow-2xl my-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Data Produk' : 'Tambah Produk Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Nama Produk</label>
                  <Input required value={formData.nama_produk} onChange={e => setFormData({...formData, nama_produk: e.target.value})} placeholder="Cth: Cincin Emas Putih Berlian" />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Kategori</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.kategori_id} 
                    onChange={e => setFormData({...formData, kategori_id: e.target.value})}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {db.kategori_emas.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Kadar Emas (Contoh: 75% atau 24K)</label>
                  <Input required value={formData.kadar} onChange={e => setFormData({...formData, kadar: e.target.value})} placeholder="Cth: 75%" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Berat (Gram)</label>
                  <Input required type="number" step="0.01" value={formData.berat} onChange={e => setFormData({...formData, berat: e.target.value})} placeholder="Cth: 3.5" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Stok Awal</label>
                  <Input required type="number" value={formData.stok} onChange={e => setFormData({...formData, stok: e.target.value})} placeholder="Cth: 10" disabled={editingId !== null} />
                  {editingId && <p className="text-[10px] text-amber-600 mt-1">Stok hanya bisa diubah melalui menu Inventory.</p>}
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Harga Modal/Beli (Rp)</label>
                  <Input required type="number" value={formData.harga_beli} onChange={e => setFormData({...formData, harga_beli: e.target.value})} placeholder="Cth: 3000000" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Harga Jual (Rp)</label>
                  <Input required type="number" value={formData.harga_jual} onChange={e => setFormData({...formData, harga_jual: e.target.value})} placeholder="Cth: 3500000" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" isLoading={isSubmitting}>Simpan Data</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- ADMIN INVENTORY VIEW (CRUD) ---
const AdminInventory = ({ db, refreshDb, setToast, user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ produk_id: '', tipe: 'masuk', jumlah: '', keterangan: '' });

  const openAddModal = () => {
    setFormData({ produk_id: db.produk_emas[0]?.id || '', tipe: 'masuk', jumlah: '', keterangan: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const product = db.produk_emas.find(p => p.id === formData.produk_id);
      if (!product) throw new Error("Produk tidak valid");

      const qty = parseInt(formData.jumlah, 10);
      let newStok = product.stok;

      if (formData.tipe === 'masuk') {
        newStok += qty;
      } else {
        if (newStok < qty) throw new Error("Stok produk tidak mencukupi untuk dikeluarkan!");
        newStok -= qty;
      }

      await sbFetch('/inventory_emas', { method: 'POST', body: JSON.stringify({
        produk_id: formData.produk_id, user_id: user.id, tipe: formData.tipe, jumlah: qty, keterangan: formData.keterangan || `Penyesuaian manual oleh ${user.nama}`,
        created_at: new Date().toISOString()
      })});

      await sbFetch(`/produk_emas?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify({ stok: newStok }) });

      setToast({ message: `Mutasi berhasil. Stok kini: ${newStok}`, type: 'success' });
      setIsModalOpen(false);
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (inv) => {
    if (!window.confirm('Yakin menghapus riwayat ini? PENTING: Menghapus riwayat akan mengembalikan (revert) stok produk secara otomatis.')) return;
    try {
      const product = db.produk_emas.find(p => p.id === inv.produk_id);
      if (product) {
        let revertedStok = product.stok;
        if (inv.tipe === 'masuk') revertedStok -= inv.jumlah;
        else revertedStok += inv.jumlah;
        await sbFetch(`/produk_emas?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify({ stok: revertedStok }) });
      }

      await sbFetch(`/inventory_emas?id=eq.${inv.id}`, { method: 'DELETE' });
      setToast({ message: 'Riwayat mutasi dihapus dan stok telah dikembalikan.', type: 'success' });
      refreshDb();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Emas (Mutasi)</h2>
          <p className="text-sm text-slate-500">Kelola dan pantau barang masuk / keluar.</p>
        </div>
        <Button onClick={openAddModal}><Plus size={16} className="mr-2"/> Tambah Mutasi Stok</Button>
      </div>
      
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Produk</th><th className="px-6 py-4">Tipe</th><th className="px-6 py-4">Jumlah</th><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {db.inventory_emas.length === 0 && <tr><td colSpan="6" className="text-center py-4 text-slate-500">Tidak ada riwayat inventory.</td></tr>}
              {db.inventory_emas.map((inv) => {
                const produk = db.produk_emas.find(p => p.id === inv.produk_id);
                return (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{produk?.nama_produk || 'Unknown ID'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold flex items-center w-fit gap-1 ${inv.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {inv.tipe === 'masuk' ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>} {inv.tipe.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{inv.jumlah} pcs</td>
                    <td className="px-6 py-4 text-slate-500">{inv.keterangan || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="danger" className="px-2 py-1 h-auto" onClick={() => handleDelete(inv)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal CRUD Inventory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Input Mutasi Stok Manual</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Pilih Produk</label>
                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.produk_id} onChange={e => setFormData({...formData, produk_id: e.target.value})}>
                  <option value="">-- Pilih Produk --</option>
                  {db.produk_emas.map(p => <option key={p.id} value={p.id}>{p.nama_produk} (Stok: {p.stok})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tipe Mutasi</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={formData.tipe} onChange={e => setFormData({...formData, tipe: e.target.value})}>
                    <option value="masuk">Barang Masuk</option>
                    <option value="keluar">Barang Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Jumlah (Pcs)</label>
                  <Input required type="number" min="1" value={formData.jumlah} onChange={e => setFormData({...formData, jumlah: e.target.value})} placeholder="Cth: 5" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Keterangan (Opsional)</label>
                <textarea rows={2} value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: Restock dari supplier..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" isLoading={isSubmitting}>Simpan Mutasi</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- RIWAYAT TRANSAKSI VIEW (BISA UNTUK ADMIN & KASIR) ---
const TransaksiHistory = ({ db, refreshDb, setToast, user }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filterType, setFilterType] = useState('semua');

  const now = new Date();
  const currentWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [currYear, currMonth] = currentWIB.split('-');

  let displayTx = user.role === 'admin' ? db.transaksi : db.transaksi.filter(tx => tx.user_id === user.id);

  if (filterType === 'harian') {
    displayTx = displayTx.filter(tx => {
      if (!tx.created_at) return false;
      const txWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(tx.created_at));
      return txWIB === currentWIB;
    });
  } else if (filterType === 'bulanan') {
    displayTx = displayTx.filter(tx => {
      if (!tx.created_at) return false;
      const txWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(tx.created_at));
      return txWIB.startsWith(`${currYear}-${currMonth}`);
    });
  } else if (filterType === 'tahunan') {
    displayTx = displayTx.filter(tx => {
      if (!tx.created_at) return false;
      const txWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(tx.created_at));
      return txWIB.startsWith(`${currYear}`);
    });
  }

  const openDetail = async (tx) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
    setLoadingDetails(true);
    try {
      const data = await sbFetch(`/detail_transaksi?transaksi_id=eq.${tx.id}`);
      setDetails(data || []);
    } catch (err) {
      setToast({ message: `Gagal memuat detail: ${err.message}`, type: 'error' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExport = () => {
    const exportData = displayTx.map(tx => {
      const kasir = db.users.find(u => u.id === tx.user_id);
      const cabang = db.cabang.find(c => c.id === tx.cabang_id);
      const laba = db.laporan_laba.find(l => l.transaksi_id === tx.id);
      return {
        'Waktu (WIB)': formatDate(tx.created_at),
        'Kode Transaksi': tx.kode_transaksi,
        'Kasir': kasir ? kasir.nama : '-',
        'Cabang': cabang ? cabang.nama_cabang : '-',
        'Pelanggan/Catatan': tx.catatan || '-',
        'Total Item': tx.total_item,
        'Total Pendapatan (Rp)': tx.total_bayar,
        'Laba Bersih (Rp)': laba ? laba.laba : 0,
        'Metode Pembayaran': tx.metode_pembayaran?.toUpperCase() || '-'
      };
    });
    exportToCSV(`Laporan_Transaksi_Penjualan_${filterType}_${Date.now()}.csv`, exportData);
  };

  const handleCancelTx = async (tx) => {
    if (!window.confirm(`Yakin ingin membatalkan & menghapus transaksi ${tx.kode_transaksi}?\n\nSistem akan mengembalikan stok produk yang terbeli secara otomatis.`)) return;

    try {
      const detailsList = await sbFetch(`/detail_transaksi?transaksi_id=eq.${tx.id}&select=*`);

      for (const item of (detailsList || [])) {
        const product = db.produk_emas.find(p => p.id === item.produk_id);
        if (product) {
          const newStok = product.stok + item.qty;
          await sbFetch(`/produk_emas?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify({ stok: newStok }) });
          
          await sbFetch('/inventory_emas', {
            method: 'POST',
            body: JSON.stringify({
              produk_id: product.id, user_id: user.id, tipe: 'masuk', jumlah: item.qty, keterangan: `Pembatalan Transaksi ${tx.kode_transaksi}`, created_at: new Date().toISOString()
            })
          });
        }
      }

      await sbFetch(`/transaksi?id=eq.${tx.id}`, { method: 'DELETE' });

      setToast({ message: `Transaksi ${tx.kode_transaksi} berhasil dibatalkan. Stok telah dikembalikan.`, type: 'success' });
      refreshDb();
    } catch (error) {
      setToast({ message: `Gagal membatalkan transaksi: ${error.message}`, type: 'error' });
    }
  };

  const handlePrint = () => {
    if (!selectedTx) return;
    const kasir = db.users.find(u => u.id === selectedTx.user_id);
    const cabang = db.cabang.find(c => c.id === selectedTx.cabang_id);
    
    let customerName = 'Umum';
    let customerPhone = '-';
    if (selectedTx.catatan) {
      const parts = selectedTx.catatan.split(' | ');
      customerName = parts[0]?.replace('Nama: ', '') || 'Umum';
      customerPhone = parts[1]?.replace('HP: ', '') || '-';
    }

    const printContent = `
      <html>
        <head>
          <title>Struk - ${selectedTx.kode_transaksi}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
            body { font-family: 'Space Mono', 'Courier New', Courier, monospace; width: 320px; margin: 0 auto; padding: 20px 10px; color: #000; background: #fff; font-size: 12px; }
            .receipt-container { border: 1px dashed #ccc; padding: 15px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 20px; letter-spacing: -1px;}
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .border-t { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 10px; }
            .text-xs { font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            td { font-size: 12px; padding: 4px 0; vertical-align: top; }
            .right { text-align: right; }
            .label { color: #555; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center font-bold text-xl mb-2">💎 88 GOLD</div>
            <div class="text-center text-xs border-b">Premium Point of Sale<br/>${cabang ? cabang.nama_cabang : 'Pusat'}</div>
            
            <div class="text-xs mt-2 border-b">
              <div class="flex"><span class="label">Tanggal:</span> <span>${formatDate(selectedTx.created_at)}</span></div>
              <div class="flex"><span class="label">Nota:</span> <span class="font-bold">${selectedTx.kode_transaksi}</span></div>
              <div class="flex"><span class="label">Kasir:</span> <span>${kasir ? kasir.nama : '-'}</span></div>
              <div class="flex"><span class="label">Pelanggan:</span> <span>${customerName}</span></div>
              ${customerPhone !== '-' ? `<div class="flex"><span class="label">No. HP:</span> <span>${customerPhone}</span></div>` : ''}
            </div>
            
            <table>
              ${details.map(item => {
                const product = db.produk_emas.find(p => p.id === item.produk_id);
                return `
                <tr>
                  <td colspan="2" class="font-bold">${product ? product.nama_produk : 'Produk Dihapus'}</td>
                </tr>
                <tr>
                  <td class="text-xs">${item.qty} x ${formatRupiah(item.harga)}</td>
                  <td class="right font-bold">${formatRupiah(item.subtotal)}</td>
                </tr>
              `}).join('')}
            </table>
            
            <div class="border-t"></div>
            <div class="flex font-bold text-lg"><span>Total:</span><span>${formatRupiah(selectedTx.total_bayar)}</span></div>
            <div class="flex mt-2"><span>Bayar (${selectedTx.metode_pembayaran.toUpperCase()}):</span><span>${formatRupiah(selectedTx.uang_dibayar)}</span></div>
            <div class="flex"><span>Kembali:</span><span>${formatRupiah(selectedTx.kembalian)}</span></div>
            
            <div class="text-center text-xs mt-2 border-t pt-4">
              <p class="font-bold mb-1">TERIMA KASIH</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      setToast({ message: 'Popup diblokir oleh browser. Izinkan popup untuk mencetak struk.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{user.role === 'admin' ? 'Semua Riwayat Transaksi' : 'Riwayat Transaksi Anda'}</h2>
          <p className="text-sm text-slate-500">Daftar riwayat penjualan. Anda dapat melihat detail atau membatalkan (hapus) transaksi yang salah.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
            <button onClick={() => setFilterType('harian')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'harian' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Hari Ini</button>
            <button onClick={() => setFilterType('bulanan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'bulanan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Bulan Ini</button>
            <button onClick={() => setFilterType('tahunan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'tahunan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Tahun Ini</button>
            <button onClick={() => setFilterType('semua')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'semua' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Semua</button>
          </div>
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none"><Download size={16} className="mr-2"/> Export Excel</Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Kode Transaksi</th>
                {user.role === 'admin' && <th className="px-6 py-4">Kasir / Cabang</th>}
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Pendapatan</th>
                {user.role === 'admin' && <th className="px-6 py-4">Laba</th>}
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayTx.length === 0 && <tr><td colSpan={user.role === 'admin' ? 7 : 5} className="text-center py-8 text-slate-500">Tidak ada transaksi ditemukan pada rentang waktu ini.</td></tr>}
              {displayTx.map((tx) => {
                const kasir = db.users.find(u => u.id === tx.user_id);
                const cabang = db.cabang.find(c => c.id === tx.cabang_id);
                const laba = db.laporan_laba.find(l => l.transaksi_id === tx.id);
                return (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                    <td className="px-6 py-4 font-bold text-amber-600 whitespace-nowrap">{tx.kode_transaksi}</td>
                    {user.role === 'admin' && <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{kasir?.nama || '-'}<br/><span className="text-xs text-slate-400 font-normal">{cabang?.nama_cabang || '-'}</span></td>}
                    <td className="px-6 py-4 text-slate-800 whitespace-nowrap">{tx.total_item} pcs</td>
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{formatRupiah(tx.total_bayar)}</td>
                    {user.role === 'admin' && <td className="px-6 py-4 font-bold text-green-600 whitespace-nowrap">{formatRupiah(laba?.laba || 0)}</td>}
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs" onClick={() => openDetail(tx)}>Detail</Button>
                      <Button variant="danger" className="px-3 py-1.5 h-auto text-xs" onClick={() => handleCancelTx(tx)}>
                        <Trash2 size={14} className="mr-1" /> Batal
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detail */}
      {isDetailOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Detail Transaksi</h3>
                <p className="text-sm font-semibold text-amber-600">{selectedTx.kode_transaksi}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500">{formatDate(selectedTx.created_at)}</p>
              </div>
            </div>
            
            {loadingDetails ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
            ) : (
              <div className="max-h-[250px] overflow-y-auto mb-4 border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr><th className="p-3">Produk</th><th className="p-3">Harga</th><th className="p-3 text-right">Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {details.map((d, idx) => {
                      const product = db.produk_emas.find(p => p.id === d.produk_id);
                      return (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{product ? product.nama_produk : 'Produk Dihapus'}</p>
                            <p className="text-xs text-slate-500">Qty: {d.qty}</p>
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">{formatRupiah(d.harga)}</td>
                          <td className="p-3 font-bold text-slate-800 text-right whitespace-nowrap">{formatRupiah(d.subtotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-2 mb-6 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Metode Bayar</span><span className="font-bold uppercase text-slate-800">{selectedTx.metode_pembayaran}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Uang Diterima</span><span className="font-medium text-slate-800">{formatRupiah(selectedTx.uang_dibayar)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kembalian</span><span className="font-medium text-slate-800">{formatRupiah(selectedTx.kembalian)}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-200 mt-2"><span className="font-bold text-slate-700">Total Tagihan</span><span className="font-black text-amber-600 text-lg">{formatRupiah(selectedTx.total_bayar)}</span></div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={handlePrint}><Printer size={16} className="mr-2"/> Cetak Struk</Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsDetailOpen(false)}>Tutup Panel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- KASIR BUYBACK VIEW (NEW) ---
const KasirBuyback = ({ db, refreshDb, setToast, user }) => {
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({ nama_emas: '', kadar: '', berat: '', harga_per_gram: '', kondisi: '' });
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ customerName: '', customerPhone: '', paymentMethod: 'tunai', catatan: '' });
  const [successTx, setSuccessTx] = useState(null);

  const totalBerat = cart.reduce((sum, item) => sum + parseFloat(item.berat), 0);
  const totalBayar = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleAddItem = (e) => {
    e.preventDefault();
    const berat = parseFloat(formData.berat);
    const harga = parseFloat(formData.harga_per_gram);
    if (isNaN(berat) || isNaN(harga)) return setToast({ message: 'Berat & Harga wajib angka', type: 'error' });

    setCart([...cart, { ...formData, id: Date.now(), subtotal: berat * harga }]);
    setFormData({ nama_emas: '', kadar: '', berat: '', harga_per_gram: '', kondisi: '' });
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return setToast({ message: 'Data perhiasan kosong!', type: 'error' });
    if (!checkoutData.customerName) return setToast({ message: 'Nama pelanggan wajib diisi', type: 'error' });

    setIsProcessing(true);
    const kodeBb = `BB-${Date.now()}`;

    try {
      const bbDataArr = await sbFetch('/buyback', {
        method: 'POST',
        body: JSON.stringify({
          kode_buyback: kodeBb, user_id: user.id, cabang_id: user.cabang_id,
          nama_customer: checkoutData.customerName, no_hp: checkoutData.customerPhone,
          total_berat: totalBerat, total_bayar: totalBayar,
          metode_pembayaran: checkoutData.paymentMethod, catatan: checkoutData.catatan, status: 'selesai',
          created_at: new Date().toISOString()
        })
      });
      
      const bbData = bbDataArr[0];

      const detailPayload = cart.map(item => ({
        buyback_id: bbData.id, nama_emas: item.nama_emas, kadar: item.kadar,
        berat: parseFloat(item.berat), harga_per_gram: parseFloat(item.harga_per_gram),
        subtotal: item.subtotal, kondisi: item.kondisi
      }));
      
      await sbFetch('/detail_buyback', { method: 'POST', body: JSON.stringify(detailPayload) });

      // Catat ke Buku Keuangan (Pengeluaran)
      await sbFetch('/keuangan', {
        method: 'POST',
        body: JSON.stringify({
          cabang_id: user.cabang_id,
          user_id: user.id,
          tipe: 'pengeluaran',
          kategori: 'Buyback Perhiasan',
          nominal: totalBayar,
          keterangan: `Pengeluaran otomatis untuk Buyback Pelanggan (${kodeBb})`,
          created_at: new Date().toISOString()
        })
      });

      setSuccessTx({
        kodeTx: kodeBb, 
        totalBayar, 
        items: [...cart],
        metodePembayaran: checkoutData.paymentMethod,
        tanggal: new Date().toISOString(),
        customerName: checkoutData.customerName || 'Umum',
        customerPhone: checkoutData.customerPhone || '-'
      });

      setToast({ message: `Buyback ${kodeBb} Berhasil Disimpan!`, type: 'success' });
      setCart([]); setIsCheckoutOpen(false);
      setCheckoutData({ customerName: '', customerPhone: '', paymentMethod: 'tunai', catatan: '' });
      refreshDb();
    } catch (error) {
      setToast({ message: `Gagal proses buyback: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!successTx) return;
    
    const printContent = `
      <html>
        <head>
          <title>Struk Buyback - ${successTx.kodeTx}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
            body { 
              font-family: 'Space Mono', 'Courier New', Courier, monospace; 
              width: 300px; 
              margin: 0 auto; 
              padding: 20px 10px; 
              color: #000; 
              background: #fff;
              font-size: 12px;
            }
            .receipt-container {
              border: 1px dashed #333;
              padding: 15px;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 20px; letter-spacing: -1px;}
            .border-b { border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px; }
            .border-t { border-top: 1px dashed #333; padding-top: 8px; margin-top: 8px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 10px; }
            .mb-2 { margin-bottom: 10px; }
            .text-xs { font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            td { font-size: 12px; padding: 4px 0; vertical-align: top; }
            .right { text-align: right; }
            .label { color: #555; }
            .badge { background: #000; color: #fff; padding: 2px 6px; font-weight: bold; font-size: 10px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center font-bold text-xl mb-2">💎 88 GOLD</div>
            <div class="text-center text-xs border-b">Premium Point of Sale<br/>${user.cabang_nama}</div>
            
            <div class="text-center mt-2 mb-2"><span class="badge">BUKTI BUYBACK</span></div>

            <div class="text-xs mt-2 border-b">
              <div class="flex"><span class="label">Tanggal:</span> <span>${formatDate(successTx.tanggal)}</span></div>
              <div class="flex"><span class="label">Nota:</span> <span class="font-bold">${successTx.kodeTx}</span></div>
              <div class="flex"><span class="label">Kasir:</span> <span>${user.nama}</span></div>
              <div class="flex"><span class="label">Pelanggan:</span> <span>${successTx.customerName}</span></div>
              ${successTx.customerPhone !== '-' ? `<div class="flex"><span class="label">No. HP:</span> <span>${successTx.customerPhone}</span></div>` : ''}
            </div>
            
            <table>
              ${successTx.items.map(item => `
                <tr>
                  <td colspan="2" class="font-bold">${item.nama_emas}</td>
                </tr>
                <tr>
                  <td class="text-xs">${item.berat}g @ ${formatRupiah(item.harga_per_gram)}<br/>${item.kadar} - ${item.kondisi}</td>
                  <td class="right font-bold">${formatRupiah(item.subtotal)}</td>
                </tr>
              `).join('')}
            </table>
            
            <div class="border-t"></div>
            <div class="flex font-bold text-lg"><span>Total Bayar:</span><span>${formatRupiah(successTx.totalBayar)}</span></div>
            <div class="flex mt-2 text-xs"><span>Metode (${successTx.metodePembayaran.toUpperCase()}):</span><span>LUNAS KE PELANGGAN</span></div>
            
            <div class="text-center text-xs mt-2 border-t pt-4">
              <p class="font-bold mb-1">TERIMA KASIH</p>
              <p>Bukti sah pembelian perhiasan oleh toko.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      setToast({ message: 'Popup diblokir oleh browser. Izinkan popup untuk mencetak struk.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      {/* KIRI: Form Input Barang */}
      <Card className="flex-1 p-6 overflow-y-auto min-h-[400px]">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Scale size={20} className="text-amber-500"/> Input Data Perhiasan Pelanggan</h2>
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Deskripsi Barang / Nama Emas</label>
              <Input required value={formData.nama_emas} onChange={(e) => setFormData({...formData, nama_emas: e.target.value})} placeholder="Cth: Cincin Polos Patah" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Kadar Emas</label>
              <Input required value={formData.kadar} onChange={(e) => setFormData({...formData, kadar: e.target.value})} placeholder="Cth: 70%" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Kondisi Barang</label>
              <Input value={formData.kondisi} onChange={(e) => setFormData({...formData, kondisi: e.target.value})} placeholder="Cth: Bagus / Rusak / Tanpa Surat" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Berat Aktual (Gram)</label>
              <Input required type="number" step="0.01" value={formData.berat} onChange={(e) => setFormData({...formData, berat: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">Harga Deal per Gram (Rp)</label>
              <Input required type="number" value={formData.harga_per_gram} onChange={(e) => setFormData({...formData, harga_per_gram: e.target.value})} placeholder="0" />
            </div>
          </div>
          <Button type="submit" variant="secondary" className="w-full font-bold border-dashed border-2 mt-4"><Plus size={16} className="mr-2"/> Tambahkan ke Daftar</Button>
        </form>
      </Card>

      {/* KANAN: Daftar Transaksi & Checkout */}
      <Card className="w-full lg:w-[400px] flex flex-col flex-shrink-0 h-auto lg:h-full border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold">Daftar Emas ({cart.length})</div>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs font-semibold text-red-500 hover:text-red-700">Kosongkan</button>}
        </div>

        <div className="flex-1 overflow-y-auto max-h-[40vh] lg:max-h-none p-4 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <Scale size={48} className="text-slate-200 mb-4"/>
              <p className="font-medium text-sm">Belum ada barang diinput</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-50 rounded opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                <p className="text-sm font-bold text-slate-800 pr-6">{item.nama_emas}</p>
                <div className="flex justify-between items-end mt-2 text-xs text-slate-500">
                  <div>
                    <p>{item.berat}g @ {formatRupiah(item.harga_per_gram)}</p>
                    <p className="mt-0.5 px-1.5 py-0.5 bg-slate-100 w-fit rounded">{item.kadar} • {item.kondisi}</p>
                  </div>
                  <span className="font-bold text-sm text-slate-800">{formatRupiah(item.subtotal)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
          <div className="flex justify-between items-center mb-1 text-sm text-slate-500"><span className="font-semibold">Total Berat</span><span className="font-bold text-slate-800">{totalBerat} g</span></div>
          <div className="flex justify-between items-center mb-4 text-sm text-slate-500"><span className="font-semibold">Total Dibayar ke Pelanggan</span><span className="text-xl font-bold text-red-600">{formatRupiah(totalBayar)}</span></div>
          <Button className="w-full h-12 text-base font-bold" disabled={cart.length === 0} onClick={() => setIsCheckoutOpen(true)}>Proses Pembayaran Pelanggan</Button>
        </div>
      </Card>

      {/* Modal Finalisasi Buyback */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Finalisasi Buyback</h3>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center mb-6">
              <p className="text-sm font-semibold text-red-600 mb-1">Total Dibayarkan ke Pelanggan</p>
              <p className="text-3xl font-bold text-red-700">{formatRupiah(totalBayar)}</p>
            </div>
            <form onSubmit={handleCheckout} className="space-y-4">
              <Input required placeholder="Nama Pelanggan" value={checkoutData.customerName} onChange={(e) => setCheckoutData({...checkoutData, customerName: e.target.value})} disabled={isProcessing} />
              <Input required placeholder="Nomor HP Pelanggan" value={checkoutData.customerPhone} onChange={(e) => setCheckoutData({...checkoutData, customerPhone: e.target.value})} disabled={isProcessing} />
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Bayar Melalui</label>
                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={checkoutData.paymentMethod} onChange={(e) => setCheckoutData({...checkoutData, paymentMethod: e.target.value})}>
                  <option value="tunai">Tunai Kasir</option>
                  <option value="transfer">Transfer Bank Toko</option>
                </select>
              </div>
              <textarea rows={2} placeholder="Catatan Tambahan..." className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={checkoutData.catatan} onChange={(e) => setCheckoutData({...checkoutData, catatan: e.target.value})}></textarea>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" className="flex-1 font-bold" disabled={isProcessing} onClick={() => setIsCheckoutOpen(false)}>Batal</Button>
                <Button type="submit" className="flex-1 font-bold" isLoading={isProcessing}>Selesaikan</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {successTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <Card className="w-full max-w-sm p-8 shadow-2xl text-center flex flex-col items-center border-green-400">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Buyback Berhasil!</h2>
            <p className="text-slate-500 font-medium mb-6 text-sm">{successTx.kodeTx}</p>
            
            <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 mb-8 space-y-3 text-sm text-left">
              <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Total Dibayar:</span><span className="font-bold text-red-600">{formatRupiah(successTx.totalBayar)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Metode:</span><span className="font-bold uppercase text-slate-800">{successTx.metodePembayaran}</span></div>
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 font-bold bg-white" onClick={handlePrint}>
                <Printer size={16} className="mr-2" /> Cetak Bukti
              </Button>
              <Button className="flex-1 font-bold shadow-md" onClick={() => setSuccessTx(null)}>Tutup Panel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- BUYBACK HISTORY VIEW ---
const BuybackHistory = ({ db, refreshDb, setToast, user }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBb, setSelectedBb] = useState(null);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filterType, setFilterType] = useState('semua');

  const now = new Date();
  const currentWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [currYear, currMonth, currDay] = currentWIB.split('-');

  let displayBb = user.role === 'admin' ? db.buyback : db.buyback.filter(bb => bb.user_id === user.id);

  if (filterType === 'harian') {
    displayBb = displayBb.filter(bb => {
      if (!bb.created_at) return false;
      const txWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(bb.created_at));
      return txWIB === currentWIB;
    });
  } else if (filterType === 'bulanan') {
    displayBb = displayBb.filter(bb => {
      if (!bb.created_at) return false;
      const txWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(bb.created_at));
      return txWIB.startsWith(`${currYear}-${currMonth}`);
    });
  } else if (filterType === 'tahunan') {
    displayBb = displayBb.filter(bb => {
      if (!bb.created_at) return false;
      const txWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseSupabaseDate(bb.created_at));
      return txWIB.startsWith(`${currYear}`);
    });
  }

  const openDetail = async (bb) => {
    setSelectedBb(bb);
    setIsDetailOpen(true);
    setLoadingDetails(true);
    try {
      const data = await sbFetch(`/detail_buyback?buyback_id=eq.${bb.id}`);
      setDetails(data || []);
    } catch (err) {
      setToast({ message: `Gagal memuat detail: ${err.message}`, type: 'error' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExport = () => {
    const exportData = displayBb.map(bb => {
      const kasir = db.users.find(u => u.id === bb.user_id);
      const cabang = db.cabang.find(c => c.id === bb.cabang_id);
      return {
        'Waktu (WIB)': formatDate(bb.created_at),
        'Kode Buyback': bb.kode_buyback,
        'Nama Pelanggan': bb.nama_customer,
        'No HP': bb.no_hp || '-',
        'Kasir': kasir ? kasir.nama : '-',
        'Cabang': cabang ? cabang.nama_cabang : '-',
        'Total Berat (g)': bb.total_berat,
        'Total Pengeluaran (Rp)': bb.total_bayar,
        'Metode Pembayaran': bb.metode_pembayaran?.toUpperCase() || '-'
      };
    });
    exportToCSV(`Laporan_Transaksi_Buyback_${filterType}_${Date.now()}.csv`, exportData);
  };

  const handleCancelBb = async (bb) => {
    if (!window.confirm(`Yakin ingin menghapus riwayat buyback ${bb.kode_buyback}?`)) return;
    try {
      await sbFetch(`/buyback?id=eq.${bb.id}`, { method: 'DELETE' });
      setToast({ message: `Riwayat Buyback dihapus.`, type: 'success' });
      refreshDb();
    } catch (err) {
      setToast({ message: `Gagal menghapus: ${err.message}`, type: 'error' });
    }
  };

  const handlePrint = () => {
    if (!selectedBb) return;
    const kasir = db.users.find(u => u.id === selectedBb.user_id);
    const cabang = db.cabang.find(c => c.id === selectedBb.cabang_id);

    const printContent = `
      <html>
        <head>
          <title>Struk Buyback - ${selectedBb.kode_buyback}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
            body { font-family: 'Space Mono', 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px 10px; color: #000; background: #fff; font-size: 12px; }
            .receipt-container { border: 1px dashed #333; padding: 15px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 20px; letter-spacing: -1px;}
            .border-b { border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 8px; }
            .border-t { border-top: 1px dashed #333; padding-top: 8px; margin-top: 8px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 10px; }
            .text-xs { font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            td { font-size: 12px; padding: 4px 0; vertical-align: top; }
            .right { text-align: right; }
            .label { color: #555; }
            .badge { background: #000; color: #fff; padding: 2px 6px; font-weight: bold; font-size: 10px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center font-bold text-xl mb-2">💎 88 GOLD</div>
            <div class="text-center text-xs border-b">Premium Point of Sale<br/>${cabang ? cabang.nama_cabang : 'Pusat'}</div>
            
            <div class="text-center mt-2 mb-2"><span class="badge">BUKTI BUYBACK</span></div>

            <div class="text-xs mt-2 border-b">
              <div class="flex"><span class="label">Tanggal:</span> <span>${formatDate(selectedBb.created_at)}</span></div>
              <div class="flex"><span class="label">Nota:</span> <span class="font-bold">${selectedBb.kode_buyback}</span></div>
              <div class="flex"><span class="label">Kasir:</span> <span>${kasir ? kasir.nama : '-'}</span></div>
              <div class="flex"><span class="label">Pelanggan:</span> <span>${selectedBb.nama_customer}</span></div>
              ${selectedBb.no_hp !== '-' ? `<div class="flex"><span class="label">No. HP:</span> <span>${selectedBb.no_hp}</span></div>` : ''}
            </div>
            
            <table>
              ${details.map(item => `
                <tr>
                  <td colspan="2" class="font-bold">${item.nama_emas}</td>
                </tr>
                <tr>
                  <td class="text-xs">${item.berat}g @ ${formatRupiah(item.harga_per_gram)}<br/>${item.kadar} - ${item.kondisi}</td>
                  <td class="right font-bold">${formatRupiah(item.subtotal)}</td>
                </tr>
              `).join('')}
            </table>
            
            <div class="border-t"></div>
            <div class="flex font-bold text-lg"><span>Total Bayar:</span><span>${formatRupiah(selectedBb.total_bayar)}</span></div>
            <div class="flex mt-2 text-xs"><span>Metode (${selectedBb.metode_pembayaran.toUpperCase()}):</span><span>LUNAS KE PELANGGAN</span></div>
            
            <div class="text-center text-xs mt-2 border-t pt-4">
              <p class="font-bold mb-1">TERIMA KASIH</p>
              <p>Bukti sah pembelian perhiasan oleh toko.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      setToast({ message: 'Popup diblokir oleh browser. Izinkan popup untuk mencetak struk.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{user.role === 'admin' ? 'Semua Riwayat Buyback' : 'Riwayat Buyback Anda'}</h2>
          <p className="text-sm text-slate-500">Daftar transaksi pembelian emas dari pelanggan (Trade-in / Jual).</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
            <button onClick={() => setFilterType('harian')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'harian' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Hari Ini</button>
            <button onClick={() => setFilterType('bulanan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'bulanan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Bulan Ini</button>
            <button onClick={() => setFilterType('tahunan')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'tahunan' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Tahun Ini</button>
            <button onClick={() => setFilterType('semua')} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${filterType === 'semua' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Semua</button>
          </div>
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none"><Download size={16} className="mr-2"/> Export Excel</Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Kode / Pelanggan</th>
                {user.role === 'admin' && <th className="px-6 py-4">Kasir / Cabang</th>}
                <th className="px-6 py-4">Total Berat</th>
                <th className="px-6 py-4">Total Uang Keluar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayBb.length === 0 && <tr><td colSpan={user.role === 'admin' ? 6 : 5} className="text-center py-8 text-slate-500">Tidak ada riwayat buyback pada rentang waktu ini.</td></tr>}
              {displayBb.map((bb) => {
                const kasir = db.users.find(u => u.id === bb.user_id);
                const cabang = db.cabang.find(c => c.id === bb.cabang_id);
                return (
                  <tr key={bb.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(bb.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-amber-600 block">{bb.kode_buyback}</span>
                      <span className="text-slate-600">{bb.nama_customer} ({bb.no_hp})</span>
                    </td>
                    {user.role === 'admin' && <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{kasir?.nama || '-'}<br/><span className="text-xs text-slate-400 font-normal">{cabang?.nama_cabang || '-'}</span></td>}
                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{bb.total_berat} g</td>
                    <td className="px-6 py-4 font-bold text-red-600 whitespace-nowrap">{formatRupiah(bb.total_bayar)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs" onClick={() => openDetail(bb)}>Detail</Button>
                      {user.role === 'admin' && (
                        <Button variant="danger" className="px-3 py-1.5 h-auto text-xs" onClick={() => handleCancelBb(bb)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detail Buyback */}
      {isDetailOpen && selectedBb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Detail Buyback</h3>
                <p className="text-sm font-semibold text-amber-600">{selectedBb.kode_buyback}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500">{formatDate(selectedBb.created_at)}</p>
              </div>
            </div>
            
            {loadingDetails ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto mb-4 border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr><th className="p-3">Perhiasan</th><th className="p-3">Berat / Harga</th><th className="p-3 text-right">Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {details.map((d, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{d.nama_emas}</p>
                          <p className="text-xs text-slate-500">{d.kadar} • {d.kondisi}</p>
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">{d.berat}g @ {formatRupiah(d.harga_per_gram)}</td>
                        <td className="p-3 font-bold text-slate-800 text-right whitespace-nowrap">{formatRupiah(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="space-y-2 mb-6 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between"><span className="text-slate-500">Nama Pelanggan</span><span className="font-bold text-slate-800">{selectedBb.nama_customer}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Metode Bayar</span><span className="font-bold uppercase text-slate-800">{selectedBb.metode_pembayaran}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-200 mt-2"><span className="font-bold text-slate-700">Total Uang Dibayarkan</span><span className="font-black text-red-600 text-lg">{formatRupiah(selectedBb.total_bayar)}</span></div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={handlePrint}><Printer size={16} className="mr-2"/> Cetak Bukti</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setIsDetailOpen(false)}>Tutup Detail</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- KASIR DASHBOARD VIEW ---
const KasirDashboard = ({ db, user }) => {
  const userTx = db.transaksi.filter(tx => tx.user_id === user.id);
  const myTotal = userTx.reduce((sum, tx) => sum + Number(tx.total_bayar), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Selamat Bekerja, {user.nama}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-amber-100">Total Pendapatan Sif Anda</p>
              <h3 className="text-3xl font-bold mt-2">{formatRupiah(myTotal)}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm"><DollarSign size={24} /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Transaksi Selesai</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{userTx.length} Transaksi</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity size={24} /></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- KASIR POS VIEW ---
const KasirPOS = ({ db, refreshDb, setToast, user }) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [cashAmount, setCashAmount] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successTx, setSuccessTx] = useState(null);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const filteredProducts = db.produk_emas.filter(p => 
    p.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase()) && p.stok > 0
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) {
          setToast({ message: 'Stok tidak mencukupi!', type: 'error' });
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.harga_jual } : item);
      }
      return [...prev, { ...product, qty: 1, subtotal: product.harga_jual }];
    });
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return setCart(prev => prev.filter(item => item.id !== id));
    const product = db.produk_emas.find(p => p.id === id);
    if (newQty > product.stok) return setToast({ message: 'Stok tidak mencukupi!', type: 'error' });
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty, subtotal: newQty * item.harga_jual } : item));
  };

  const totalItem = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalBayar = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalModal = cart.reduce((sum, item) => sum + (item.harga_beli * item.qty), 0);
  const kembalian = cashAmount ? parseInt(cashAmount.replace(/\D/g, '') || '0') - totalBayar : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'tunai' && kembalian < 0) {
      setToast({ message: 'Uang pembayaran kurang!', type: 'error' });
      return;
    }

    setIsProcessing(true);
    const kodeTx = `TRX-${Date.now()}`;
    const uangDibayar = paymentMethod === 'tunai' ? parseInt(cashAmount.replace(/\D/g, '') || '0') : totalBayar;
    
    const catatanPelanggan = `Nama: ${customerName || 'Umum'} | HP: ${customerPhone || '-'} | Alamat: ${customerAddress || '-'}`;

    try {
      const txDataArr = await sbFetch('/transaksi', {
        method: 'POST',
        body: JSON.stringify({
          kode_transaksi: kodeTx, user_id: user.id, cabang_id: user.cabang_id,
          total_item: totalItem, total_bayar: totalBayar,
          metode_pembayaran: paymentMethod, uang_dibayar: uangDibayar, kembalian: paymentMethod === 'tunai' ? kembalian : 0, status: 'selesai', catatan: catatanPelanggan,
          created_at: new Date().toISOString()
        })
      });
      const txData = txDataArr[0];

      const detailData = cart.map(item => ({
        transaksi_id: txData.id, produk_id: item.id, qty: item.qty, harga: item.harga_jual, subtotal: item.subtotal
      }));
      await sbFetch('/detail_transaksi', { method: 'POST', body: JSON.stringify(detailData) });

      await sbFetch('/laporan_laba', {
        method: 'POST',
        body: JSON.stringify({
          transaksi_id: txData.id, total_modal: totalModal, total_penjualan: totalBayar, laba: totalBayar - totalModal
        })
      });

      for (const item of cart) {
        const newStok = item.stok - item.qty;
        await sbFetch(`/produk_emas?id=eq.${item.id}`, { method: 'PATCH', body: JSON.stringify({ stok: newStok }) });
        await sbFetch('/inventory_emas', { method: 'POST', body: JSON.stringify({ produk_id: item.id, user_id: user.id, tipe: 'keluar', jumlah: item.qty, keterangan: `Penjualan ${kodeTx}`, created_at: new Date().toISOString() })});
      }

      await sbFetch('/keuangan', {
        method: 'POST',
        body: JSON.stringify({
          cabang_id: user.cabang_id,
          user_id: user.id,
          tipe: 'pemasukan',
          kategori: 'Penjualan Emas',
          nominal: totalBayar,
          keterangan: `Pemasukan otomatis dari Penjualan POS (${kodeTx})`,
          created_at: new Date().toISOString()
        })
      });

      setSuccessTx({
        kodeTx, totalBayar, kembalian,
        items: [...cart],
        uangDibayar,
        metodePembayaran: paymentMethod,
        tanggal: new Date().toISOString(),
        customerName: customerName || 'Umum',
        customerPhone: customerPhone || '-'
      });

      setCart([]); setIsCheckoutOpen(false); setCashAmount('');
      setCustomerName(''); setCustomerPhone(''); setCustomerAddress('');
      refreshDb();

    } catch (error) {
      console.error(error);
      setToast({ message: `Gagal checkout: ${error.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!successTx) return;
    
    const printContent = `
      <html>
        <head>
          <title>Struk - ${successTx.kodeTx}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
            body { font-family: 'Space Mono', 'Courier New', Courier, monospace; width: 320px; margin: 0 auto; padding: 20px 10px; color: #000; background: #fff; font-size: 12px; }
            .receipt-container { border: 1px dashed #ccc; padding: 15px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 20px; letter-spacing: -1px;}
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .border-t { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
            .flex { display: flex; justify-content: space-between; }
            .mt-2 { margin-top: 10px; }
            .text-xs { font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            td { font-size: 12px; padding: 4px 0; vertical-align: top; }
            .right { text-align: right; }
            .label { color: #555; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="text-center font-bold text-xl mb-2">💎 88 GOLD</div>
            <div class="text-center text-xs border-b">Premium Point of Sale<br/>${user.cabang_nama}</div>
            
            <div class="text-xs mt-2 border-b">
              <div class="flex"><span class="label">Tanggal:</span> <span>${formatDate(successTx.tanggal)}</span></div>
              <div class="flex"><span class="label">Nota:</span> <span class="font-bold">${successTx.kodeTx}</span></div>
              <div class="flex"><span class="label">Kasir:</span> <span>${user.nama}</span></div>
              <div class="flex"><span class="label">Pelanggan:</span> <span>${successTx.customerName}</span></div>
              ${successTx.customerPhone !== '-' ? `<div class="flex"><span class="label">No. HP:</span> <span>${successTx.customerPhone}</span></div>` : ''}
            </div>
            
            <table>
              ${successTx.items.map(item => `
                <tr>
                  <td colspan="2" class="font-bold">${item.nama_produk}</td>
                </tr>
                <tr>
                  <td class="text-xs">${item.qty} x ${formatRupiah(item.harga_jual)}</td>
                  <td class="right font-bold">${formatRupiah(item.subtotal)}</td>
                </tr>
              `).join('')}
            </table>
            
            <div class="border-t"></div>
            <div class="flex font-bold text-lg"><span>Total:</span><span>${formatRupiah(successTx.totalBayar)}</span></div>
            <div class="flex mt-2"><span>Bayar (${successTx.metodePembayaran.toUpperCase()}):</span><span>${formatRupiah(successTx.uangDibayar)}</span></div>
            <div class="flex"><span>Kembali:</span><span>${formatRupiah(successTx.kembalian)}</span></div>
            
            <div class="text-center text-xs mt-2 border-t pt-4">
              <p class="font-bold mb-1">TERIMA KASIH</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      setToast({ message: 'Popup diblokir oleh browser. Izinkan popup untuk mencetak struk.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Cari emas (nama, kadar)..." className="pl-10 h-12" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex-1 flex flex-row overflow-x-auto overflow-y-hidden gap-4 pb-6 pt-1 px-1 items-start snap-x">
          {filteredProducts.map(p => (
            <Card key={p.id} className="p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group active:scale-95 bg-white min-w-[240px] max-w-[240px] flex-shrink-0 snap-start flex flex-col h-auto min-h-[140px]" onClick={() => addToCart(p)}>
              <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight flex-1 mb-3">{p.nama_produk}</p>
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-3 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{p.kadar || '-'} • {p.berat}g</span>
                  <span className="font-semibold text-slate-600">{p.stok} stok</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-base font-bold text-amber-600">{formatRupiah(p.harga_jual)}</span>
                  <div className="bg-amber-50 text-amber-600 p-1.5 rounded-md group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filteredProducts.length === 0 && <p className="text-slate-500 w-full text-center mt-10">Produk tidak ditemukan atau stok habis.</p>}
        </div>
      </div>

      <Card className="w-full lg:w-[400px] flex flex-col flex-shrink-0 h-auto lg:h-full border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <ShoppingCart size={18} className="text-amber-500" /> Keranjang ({totalItem})
          </div>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">Kosongkan</button>}
        </div>

        <div className="flex-1 overflow-y-auto max-h-[40vh] lg:max-h-none p-4 space-y-3 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><ShoppingCart size={32} className="text-slate-300"/></div>
              <p className="font-medium">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 leading-tight">{item.nama_produk}</p>
                  <p className="text-xs font-semibold text-amber-600 mt-1">{formatRupiah(item.harga_jual)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <div className="flex items-center gap-1 bg-slate-50 rounded-md p-1 border border-slate-200">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded font-bold">-</button>
                    <span className="text-sm w-5 text-center font-bold text-slate-800">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded font-bold">+</button>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mt-2">{formatRupiah(item.subtotal)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-semibold text-sm">Total Tagihan</span>
            <span className="text-2xl font-bold text-slate-800">{formatRupiah(totalBayar)}</span>
          </div>
          <Button className="w-full h-12 text-base font-bold shadow-lg shadow-amber-500/20" disabled={cart.length === 0} onClick={() => setIsCheckoutOpen(true)}>
            Checkout Transaksi
          </Button>
        </div>
      </Card>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl shadow-black/10 border-0">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Proses Pembayaran</h3>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6 text-center">
                <p className="text-sm font-semibold text-amber-700 mb-1">Total Tagihan</p>
                <p className="text-3xl font-bold text-amber-600">{formatRupiah(totalBayar)}</p>
              </div>

              <div className="mb-6 border-b border-slate-100 pb-6">
                <label className="text-sm font-semibold text-slate-700 mb-3 block">Data Pelanggan (Opsional)</label>
                <div className="space-y-3">
                  <Input type="text" placeholder="Nama Lengkap" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isProcessing} />
                  <Input type="text" placeholder="No. HP / WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={isProcessing} />
                  <Input type="text" placeholder="Alamat Singkat" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} disabled={isProcessing} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ id: 'tunai', icon: Banknote, label: 'Tunai' }, { id: 'transfer', icon: CreditCard, label: 'Transfer' }, { id: 'qris', icon: Wallet, label: 'QRIS' }].map(m => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all font-bold ${paymentMethod === m.id ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <m.icon size={24} /> <span className="text-xs">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {paymentMethod === 'tunai' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Uang Diterima (Rp)</label>
                    <Input type="text" className="text-xl font-bold h-12 text-slate-800" placeholder="Rp 0" value={cashAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCashAmount(val ? formatRupiah(parseInt(val)).replace(',00', '') : '');
                      }}
                    />
                    {cashAmount && (
                      <div className="flex justify-between items-center mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm font-semibold text-slate-600">Kembalian</span>
                        <span className={`font-bold ${kembalian < 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {kembalian < 0 ? 'Uang Kurang' : formatRupiah(kembalian)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="secondary" className="flex-1 font-bold" disabled={isProcessing} onClick={() => setIsCheckoutOpen(false)}>Batal</Button>
                <Button className="flex-1 font-bold shadow-md shadow-amber-500/20" isLoading={isProcessing} onClick={handleCheckout}>Proses Bayar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {successTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <Card className="w-full max-w-sm p-8 shadow-2xl text-center flex flex-col items-center border-green-400">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Transaksi Berhasil!</h2>
            <p className="text-slate-500 font-medium mb-6 text-sm">{successTx.kodeTx}</p>
            
            <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 mb-8 space-y-3 text-sm text-left">
              <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Total Tagihan:</span><span className="font-bold text-slate-800">{formatRupiah(successTx.totalBayar)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kembalian:</span><span className="font-bold text-green-600">{formatRupiah(successTx.kembalian)}</span></div>
            </div>

            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 font-bold bg-white" onClick={handlePrint}>
                <Printer size={16} className="mr-2" /> Cetak Struk
              </Button>
              <Button className="flex-1 font-bold shadow-md" onClick={() => setSuccessTx(null)}>Tutup Panel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. MAIN LAYOUT & ROUTING 
// ============================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('/dashboard');
  const [toast, setToast] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real DB State
  const [db, setDb] = useState({
    cabang: [], kategori_emas: [], produk_emas: [], inventory_emas: [], transaksi: [], laporan_laba: [], users: [], buyback: [], keuangan: []
  });

  // Cek Session Storage saat pertama kali load
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_user');
    const savedRoute = localStorage.getItem('pos_route');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedRoute) setRoute(savedRoute);
      } catch (e) {
        console.error("Gagal load session");
      }
    }
  }, []);

  // Simpan route terakhir agar tidak hilang saat direfresh
  useEffect(() => {
    if (user && route) {
      localStorage.setItem('pos_route', route);
    }
  }, [route, user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_route');
  };

  const fetchDatabase = async () => {
    setIsInitializing(true);
    try {
      const [
        resCabang, resKategori, resProduk, resInv, 
        resTx, resLaba, resUsers, resBuyback, resKeuangan
      ] = await Promise.all([
        sbFetch('/cabang?select=*'),
        sbFetch('/kategori_emas?select=*'),
        sbFetch('/produk_emas?select=*&order=created_at.desc'),
        sbFetch('/inventory_emas?select=*&order=created_at.desc'),
        sbFetch('/transaksi?select=*&order=created_at.desc'),
        sbFetch('/laporan_laba?select=*'),
        sbFetch('/users?select=*&order=created_at.desc'),
        sbFetch('/buyback?select=*&order=created_at.desc'),
        sbFetch('/keuangan?select=*&order=created_at.desc').catch(() => [])
      ]);

      setDb({
        cabang: resCabang || [],
        kategori_emas: resKategori || [],
        produk_emas: resProduk || [],
        inventory_emas: resInv || [],
        transaksi: resTx || [],
        laporan_laba: resLaba || [],
        users: resUsers || [],
        buyback: resBuyback || [],
        keuangan: resKeuangan || []
      });
    } catch (error) {
      setToast({ message: `Gagal memuat data: ${error.message}`, type: 'error' });
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDatabase();
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tutup menu mobile saat rute berubah
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [route]);

  if (!user) {
    return <LoginView onLogin={(u) => {
      setUser(u);
      localStorage.setItem('pos_user', JSON.stringify(u));
      setRoute(u.role === 'admin' ? '/admin/dashboard' : '/kasir/dashboard');
    }} />;
  }

  const adminMenu = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/produk', icon: Package, label: 'Data Emas' },
    { path: '/admin/inventory', icon: Box, label: 'Inventory Masuk/Keluar' },
    { path: '/admin/keuangan', icon: Landmark, label: 'Buku Kas / Keuangan' },
    { path: '/admin/transaksi', icon: FileText, label: 'Riwayat Transaksi' },
    { path: '/admin/buyback', icon: RefreshCcw, label: 'Riwayat Buyback' },
    { path: '/admin/cabang', icon: Store, label: 'Kelola Cabang' },
    { path: '/admin/users', icon: Users, label: 'Manajemen User' },
  ];

  const kasirMenu = [
    { path: '/kasir/dashboard', icon: LayoutDashboard, label: 'Dashboard Kasir' },
    { path: '/kasir/pos', icon: ShoppingCart, label: 'Penjualan (POS)' },
    { path: '/kasir/buyback', icon: Scale, label: 'Terima Buyback' },
    { path: '/kasir/transaksi', icon: FileText, label: 'Riwayat Penjualan' },
    { path: '/kasir/riwayat-buyback', icon: RefreshCcw, label: 'Riwayat Buyback' },
  ];

  const currentMenu = user.role === 'admin' ? adminMenu : kasirMenu;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900 flex overflow-hidden">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* OVERLAY MOBILE SIDEBAR */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button 
          className="md:hidden absolute top-5 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-full"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>

        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <h1 className="text-xl font-serif font-bold text-amber-500 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">88</div>
            GoldJewellery
          </h1>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 px-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
            <div className="space-y-1">
              {currentMenu.map(menu => (
                <button key={menu.path} onClick={() => setRoute(menu.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${route === menu.path ? 'bg-amber-50 text-amber-600 shadow-[inset_3px_0_0_#f59e0b]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                  <menu.icon size={18} className={route === menu.path ? 'text-amber-500' : 'text-slate-400'} />
                  {menu.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-600 font-bold uppercase shrink-0">
              {user.nama.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{user.nama}</p>
              <p className="text-xs font-semibold text-amber-600 capitalize truncate">{user.role}</p>
            </div>
          </div>
          <Button variant="danger" className="w-full justify-center text-sm font-bold bg-white shadow-sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-screen overflow-y-auto">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span className="capitalize hidden sm:inline">{user.role}</span>
              <ChevronRight size={14} className="text-slate-300 hidden sm:inline" />
              <span className="text-slate-800 font-bold truncate max-w-[150px] sm:max-w-none">
                {currentMenu.find(m => m.path === route)?.label || 'Halaman'}
              </span>
              {isInitializing && <Loader2 size={14} className="animate-spin text-amber-500 ml-2"/>}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Indikator Cabang Aktif */}
             <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <MapPin size={14} className="text-amber-500" />
                {user.cabang_nama}
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {/* Router Outlet */}
          {route === '/admin/dashboard' && <AdminDashboard db={db} />}
          {route === '/admin/produk' && <AdminProducts db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/admin/cabang' && <AdminCabang db={db} refreshDb={fetchDatabase} setToast={setToast} />}
          {route === '/admin/inventory' && <AdminInventory db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/admin/keuangan' && <AdminKeuangan db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/admin/transaksi' && <TransaksiHistory db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/admin/buyback' && <BuybackHistory db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/admin/users' && <AdminUsers db={db} refreshDb={fetchDatabase} setToast={setToast} />}
          
          {route === '/kasir/dashboard' && <KasirDashboard db={db} user={user} />}
          {route === '/kasir/pos' && <KasirPOS db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/kasir/buyback' && <KasirBuyback db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/kasir/transaksi' && <TransaksiHistory db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
          {route === '/kasir/riwayat-buyback' && <BuybackHistory db={db} refreshDb={fetchDatabase} setToast={setToast} user={user} />}
        </div>
      </main>
    </div>
  );
}