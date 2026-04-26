import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Package, History, AlertCircle, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Search, 
  Plus, Download, Upload, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from './api';
import Swal from 'sweetalert2';

// --- TAMBAHKAN BARIS INI ---
// Mengambil link dari Environment Variable Vercel, jika tidak ada pakai localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'https://msmbackend-production-765b.up.railway.app';

const App = () => {
  // 1. States
  const [view, setView] = useState("overview");
  const [rawProducts, setRawProducts] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [uploadType, setUploadType] = useState("restock");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [previewData, setPreviewData] = useState([]); // Buat simpan data tabel preview
  const [selectedFile, setSelectedFile] = useState(null); // Buat simpan file yang dipilih
 

  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [resStock, resHist] = await Promise.all([
        api.get('/products'),
        api.get('/stock/history')
      ]);

      const flatData = resStock.data?.flatMap(product => 
        product.sizes?.map(s => ({ 
          ...s, 
          productName: product.name,
          price: product.price 
        })) || []
      ) || [];
      
      setRawProducts(flatData.sort((a, b) => a.productName.localeCompare(b.productName)));
      setHistoryData(resHist.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. Logic: Search & Pagination
  const filteredItems = rawProducts.filter(item => 
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // 3. Stats
  const totalItems = rawProducts.length;
  const totalStock = rawProducts.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  const lowStockCount = rawProducts.filter(item => item.stock < 3).length;

  const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setSelectedFile(file);
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    const rows = text.split('\n').slice(0, 6); // Ambil 5 baris buat preview
    const data = rows.map(row => row.split(','));
    setPreviewData(data);
  };
  reader.readAsText(file);
};

  const handleUploadSubmit = async () => {
  if (!selectedFile) return;
  const formData = new FormData();
  formData.append('file', selectedFile);
  try {
    Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });
    await api.post(`/stock/bulk-${uploadType}`, formData);
    
    Swal.fire('Success!', 'Data Broodis Berhasil Diupdate', 'success');
    setShowModal(false);
    setSelectedFile(null);
    setPreviewData([]);
    fetchData();
  } catch (err) {
    Swal.fire('Error', 'Gagal upload coo, cek format CSV-nya', 'error');
  }
};

  const getStatusStyle = (stock) => {
    if (stock >= 3) return "text-green-600 bg-green-50 border-green-100";
    if (stock === 2) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100 animate-pulse";
  };

  const getStatusLabel = (stock) => {
    if (stock >= 3) return "Safe";
    if (stock === 2) return "Warning";
    return "Critical";
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-900 font-['Poppins']">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111827] text-white flex flex-col p-6 sticky top-0 h-screen hidden md:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-orange-500 p-2 rounded-lg shadow-lg shadow-orange-500/20"><Package size={20} /></div>
          <h1 className="text-xl font-bold tracking-tight uppercase font-['Poppins'] text-white">MUKU</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Overview" active={view === 'overview'} onClick={() => setView('overview')} />
          <NavItem icon={<Package size={20} />} label="Inventory" active={view === 'inventory'} onClick={() => setView('inventory')} />
          <NavItem icon={<History size={20} />} label="History" active={view === 'history'} onClick={() => setView('history')} />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto font-['Poppins']">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter font-['Poppins']">
            {view} <span className="text-slate-300 font-light italic">/ MUKU</span>
          </h2>
          {view === "inventory" && (
            <button onClick={() => setShowModal(true)} className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-black/10 font-['Poppins'] uppercase">
              <Plus size={16} /> import CSV
            </button>
          )}
        </header>

        {/* VIEW: OVERVIEW */}
        {view === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 font-['Poppins']">
              <StatCard title="Total Product" value={totalItems} icon={<Package className="text-blue-600" />} />
              <StatCard title="Total Stock" value={totalStock} icon={<TrendingUp className="text-emerald-600" />} />
              <StatCard title="Low Alerts" value={lowStockCount} icon={<AlertCircle className="text-red-600" />} color="bg-red-50/50" />
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 font-['Poppins']">
              <h3 className="font-bold mb-6 flex items-center gap-2 uppercase text-xs tracking-widest text-slate-400 font-['Poppins']"><TrendingUp size={14}/> Stock Movement Trend</h3>
              <div className="h-[400px] min-h-[400px] w-full">
                {historyData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="created_at" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Area type="monotone" dataKey="qty_change" stroke="#f97316" fill="#fff7ed" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-50 rounded-[2rem] text-xs uppercase font-['Poppins']">No movement data yet</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* VIEW: INVENTORY */}
        {view === "inventory" && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-['Poppins']">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div className="flex gap-4 items-center flex-1">
                <div className="relative w-full max-w-md font-['Poppins']">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" placeholder="Search product..." 
                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm font-['Poppins'] focus:ring-2 focus:ring-orange-500/20"
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                {/* --- UPDATE DI SINI: PAKAI BASE_URL --- */}
                <a 
                  href={`${BASE_URL}/stock/export`} 
                  className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 font-['Poppins'] uppercase"
                >
                  <Download size={16} /> Export Stock
                </a>
              </div>
              <div className="flex items-center gap-4 font-['Poppins']">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-['Poppins']">Page {currentPage} of {totalPages || 1}</span>
                <div className="flex gap-1">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all"><ChevronLeft size={18}/></button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all"><ChevronRight size={18}/></button>
                </div>
              </div>
            </div>
            <table className="w-full text-center">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] font-['Poppins']">
                <tr><th className="py-6">ID product</th><th className="text-left py-6 text-slate-900">Product Name</th><th>Size</th><th>Qty</th><th>Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-all border-x-4 border-transparent hover:border-orange-500 group">
                    <td className="py-6 font-mono text-[10px] text-slate-400 font-['Poppins'] uppercase">{item.code}</td>
                    <td className="text-left py-6 font-bold text-slate-900 uppercase text-sm tracking-tighter font-['Poppins']">{item.productName}</td>
                    <td><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold font-['Poppins']">{item.size}</span></td>
                    <td className="font-black text-xl font-['Poppins']">{item.stock}</td>
                    <td>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border font-['Poppins'] ${getStatusStyle(item.stock)}`}>
                        {getStatusLabel(item.stock)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {view === "history" && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 font-['Poppins']">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 font-['Poppins']">
               <div>
                  <h3 className="font-bold uppercase text-xs tracking-widest text-slate-400 font-['Poppins'] mb-1">Transaction Logs</h3>
                  <div className="text-[10px] font-black text-slate-300 font-['Poppins'] uppercase tracking-widest">Total {historyData.length} Activities Recorded</div>
               </div>
               
               {/* --- UPDATE DI SINI: PAKAI BASE_URL --- */}
               <div className="flex flex-wrap gap-2 font-['Poppins']">
                 <ExportButton url={`${BASE_URL}/stock/history/export`} label="Transaksi" color="bg-slate-900" />
                 <ExportButton url={`${BASE_URL}/stock/history/export?type=sale`} label="Sales" color="bg-red-600" />
                 <ExportButton url={`${BASE_URL}/stock/history/export?type=restock`} label="Restock" color="bg-emerald-600" />
                 <ExportButton url={`${BASE_URL}/stock/history/export?type=return`} label="Return" color="bg-orange-500" />
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-['Poppins']">
                <thead>
                  <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-['Poppins']">
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4">id product</th>
                    <th className="pb-4">Product</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4 text-right">Qty Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-['Poppins']">
                  {historyData.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors text-xs">
                      <td className="py-4 text-slate-400 font-['Poppins']">{new Date(h.created_at).toLocaleString()}</td>
                      <td className="py-4 font-mono text-slate-400 font-['Poppins'] uppercase">{h.code}</td>
                      <td className="py-4 font-bold text-slate-900 uppercase font-['Poppins']">{h.product_name}</td>
                      <td className="py-4 font-['Poppins']">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                          h.mode === 'sale' ? 'bg-red-50 text-red-600' : 
                          h.mode === 'restock' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100'
                        }`}>{h.mode || 'N/A'}</span>
                      </td>
                      <td className={`py-4 font-black text-right font-['Poppins'] ${h.qty_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {h.qty_change > 0 ? `+${h.qty_change}` : h.qty_change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL BULK UPDATE */}
      {showModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 relative">
      <button onClick={() => { setShowModal(false); setSelectedFile(null); }} className="absolute top-8 right-8 text-slate-300 hover:text-black">
        <X size={24} />
      </button>
      
      <h2 className="text-2xl font-black uppercase mb-6 text-center">Import CSV</h2>

      {/* Tipe Selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {['restock', 'sale', 'return'].map(t => (
          <button key={t} onClick={() => setUploadType(t)} className={`py-3 rounded-xl text-[10px] font-black uppercase border-2 ${uploadType === t ? 'bg-black text-white' : 'text-slate-400 border-slate-50'}`}>{t}</button>
        ))}
      </div>

      {/* --- UPDATE DI SINI: Logika Preview --- */}
      {!selectedFile ? (
        <div onClick={() => fileInputRef.current.click()} className="w-full py-16 border-4 border-dashed border-slate-50 rounded-[2.5rem] flex flex-col items-center gap-4 text-slate-300 cursor-pointer">
          <Upload size={40} />
          <span className="font-black text-xs uppercase">Pilih File CSV</span>
        </div>
      ) : (
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 overflow-x-auto">
          <p className="text-[10px] font-black text-orange-500 mb-2 uppercase">Preview Data (5 Baris):</p>
          <table className="w-full text-[10px]">
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i} className="border-b border-slate-200">
                  {row.map((cell, j) => <td key={j} className="py-1 px-1 font-mono">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setSelectedFile(null)} className="mt-4 text-red-500 text-[10px] font-bold uppercase underline">Ganti File</button>
        </div>
      )}

      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

      {/* --- UPDATE DI SINI: Tombol Submit --- */}
      <button 
        onClick={handleUploadSubmit}
        disabled={!selectedFile}
        className={`w-full py-4 rounded-2xl font-black uppercase mt-4 transition-all ${selectedFile ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
      >
        Submit to Railway
      </button>
    </div>
  </div>
)}
    </div>
  );
};

// Sub-components
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-['Poppins'] ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
    {icon} <span className="text-[10px] font-black uppercase tracking-[0.2em] font-['Poppins']">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color = "bg-white" }) => (
  <div className={`${color} p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 font-['Poppins'] hover:translate-y-[-4px] transition-all`}>
    <div className="bg-white w-fit p-4 rounded-2xl shadow-sm border border-slate-50">{icon}</div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 font-['Poppins']">{title}</p>
      <h4 className="text-4xl font-black tracking-tighter font-['Poppins']">{value}</h4>
    </div>
  </div>
);

const ExportButton = ({ url, label, color }) => (
  <a 
    href={url} 
    className={`${color} text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-all shadow-lg shadow-black/5 font-['Poppins']`}
  >
    <Download size={14} /> {label}
  </a>
);

export default App;