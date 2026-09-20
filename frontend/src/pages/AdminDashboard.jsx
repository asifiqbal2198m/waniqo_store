import { useEffect, useState } from 'react';
import api, { getMediaUrl as getImageUrl } from '../services/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'orders', 'users'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: 10,
    category: '',
  });

  // Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);

  // Process Return Modal State
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnAction, setReturnAction] = useState('approve');
  const [adminReturnNote, setAdminReturnNote] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);

  // Manage Variants Modal State
  const [managingVariantProduct, setManagingVariantProduct] = useState(null);
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarColor, setNewVarColor] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarStock, setNewVarStock] = useState(10);
  const [submittingVariant, setSubmittingVariant] = useState(false);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const handleProcessReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReturnOrder) return;

    setProcessingReturn(true);
    setError('');

    try {
      const res = await api.post(`orders/admin/${selectedReturnOrder.id}/process-return/`, {
        action: returnAction,
        admin_note: adminReturnNote.trim(),
      });

      setMsg(res.data?.message || `Return request processed successfully!`);
      setTimeout(() => setMsg(''), 4500);
      setSelectedReturnOrder(null);
      setAdminReturnNote('');
      fetchData();
    } catch (err) {
      console.error('Process return error:', err);
      const data = err.response?.data;
      setError(data?.message || data?.detail || 'Failed to process return request.');
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleCreateVariant = async (e) => {
    e.preventDefault();
    if (!managingVariantProduct) return;
    setSubmittingVariant(true);
    setError('');

    try {
      const res = await api.post(`products/admin/${managingVariantProduct.id}/variants/create/`, {
        size: newVarSize.trim(),
        color: newVarColor.trim(),
        price_override: newVarPrice ? parseFloat(newVarPrice) : null,
        stock: parseInt(newVarStock) || 10,
      });

      setMsg(res.data?.message || 'Variant created successfully!');
      setTimeout(() => setMsg(''), 3500);

      const prodRes = await api.get('products/');
      const loadedProducts = prodRes.data?.products || [];
      setProducts(loadedProducts);
      const current = loadedProducts.find(p => p.id === managingVariantProduct.id);
      if (current) setManagingVariantProduct(current);

      setNewVarSize('');
      setNewVarColor('');
      setNewVarPrice('');
      setNewVarStock(10);
    } catch (err) {
      console.error('Variant creation error:', err);
      const data = err.response?.data;
      setError(data?.message || data?.detail || 'Failed to create variant.');
    } finally {
      setSubmittingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Delete this variant option?')) return;
    try {
      await api.delete(`products/admin/variants/${variantId}/delete/`);
      setMsg('Variant removed.');
      setTimeout(() => setMsg(''), 3000);

      const prodRes = await api.get('products/');
      const loadedProducts = prodRes.data?.products || [];
      setProducts(loadedProducts);
      const current = loadedProducts.find(p => p.id === managingVariantProduct.id);
      if (current) setManagingVariantProduct(current);
    } catch (err) {
      console.error('Delete variant error:', err);
      setError('Failed to delete variant.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    let isForbidden = false;

    try {
      // Fetch orders
      const ordersRes = await api.get('orders/admin/').catch((err) => {
        if (err.response?.status === 403) isForbidden = true;
        return { data: { orders: [] } };
      });
      setOrders(ordersRes.data?.orders || []);

      // Fetch products
      const productsRes = await api.get('products/').catch(() => ({ data: { products: [] } }));
      setProducts(productsRes.data?.products || []);

      // Fetch categories
      const catRes = await api.get('products/categories/').catch(() => ({ data: { categories: [] } }));
      setCategories(catRes.data?.categories || []);

      // Fetch users
      const usersRes = await api.get('accounts/admin/users/').catch((err) => {
        if (err.response?.status === 403) isForbidden = true;
        return { data: { users: [] } };
      });
      setUsers(usersRes.data?.users || []);

      if (isForbidden) {
        setError('🔒 Admin Access Required: You are currently logged in with a Customer account. Please log in through the Admin Portal (admin@waniqo.com) to perform admin operations.');
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError('Unable to load admin workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`orders/admin/${orderId}/status/`, { status: newStatus });
      setMsg(`Order #${orderId} status updated to "${newStatus.toUpperCase()}"`);
      setTimeout(() => setMsg(''), 3500);
      fetchData();
    } catch (err) {
      console.error('Status update failed:', err);
      const data = err.response?.data;
      setError(data?.detail || data?.message || 'Failed to update order status.');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');

    if (!newProduct.name || !newProduct.price) {
      setError('Product Name and Price are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newProduct.name.trim());
      formData.append('description', newProduct.description ? newProduct.description.trim() : '');
      formData.append('price', parseFloat(newProduct.price));
      formData.append('stock', parseInt(newProduct.stock) || 0);

      if (newProduct.category && newProduct.category !== '') {
        formData.append('category', parseInt(newProduct.category));
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('products/admin/create/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Create product success:', res.data);
      setMsg(`Product "${newProduct.name}" published successfully!`);
      setTimeout(() => setMsg(''), 4000);
      setNewProduct({ name: '', description: '', price: '', stock: 10, category: '' });
      setImageFile(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      console.error('Create product error:', err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        if (data.detail) {
          setError(data.detail);
        } else if (data.message) {
          setError(data.message);
        } else {
          const messages = Object.entries(data)
            .map(([field, message]) => `${field}: ${Array.isArray(message) ? message.join(', ') : message}`)
            .join(' | ');
          setError(messages);
        }
      } else {
        setError('Failed to publish product. Please verify input fields.');
      }
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    setError('');
    try {
      await api.post('products/admin/categories/create/', {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      setMsg(`Category "${newCatName}" created successfully!`);
      setNewCatName('');
      setNewCatDesc('');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Category creation failed:', err);
      const data = err.response?.data;
      setError(data?.detail || data?.message || 'Failed to create category.');
    }
  };

  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', editingProduct.name);
      formData.append('description', editingProduct.description || '');
      formData.append('price', parseFloat(editingProduct.price));
      formData.append('stock', parseInt(editingProduct.stock));

      await api.put(`products/admin/${editingProduct.id}/update/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMsg(`Product "${editingProduct.name}" updated successfully!`);
      setEditingProduct(null);
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Edit error:', err);
      const data = err.response?.data;
      setError(data?.detail || data?.message || 'Failed to update product details.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`products/admin/${productId}/delete/`);
      setMsg('Product deactivated successfully.');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Delete product error:', err);
      setError('Failed to deactivate product.');
    }
  };

  // Calculations for KPI Cards
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const returnRequests = orders.filter((o) => o.status === 'return_requested');
  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === orderStatusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Store operations, inventory management, customer order fulfillment, and user accounts.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'products', label: `📦 Products (${products.length})` },
            { id: 'orders', label: `🚚 Orders (${orders.length})` },
            { id: 'returns', label: `↩️ Returns (${returnRequests.length})` },
            { id: 'users', label: `👥 Users (${users.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Messages */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-center animate-fadeIn shadow-sm">
          {msg}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-5 py-4 rounded-2xl text-xs sm:text-sm font-bold leading-relaxed shadow-sm">
          {error}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Store Revenue</p>
          <p className="text-2xl font-extrabold text-slate-900">₹{totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-600 font-bold">Lifetime Sales Volume</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Customer Orders</p>
          <p className="text-2xl font-extrabold text-slate-900">{orders.length}</p>
          <p className="text-[10px] text-amber-600 font-bold">{pendingOrders} Pending Fulfillment</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Catalog Products</p>
          <p className="text-2xl font-extrabold text-slate-900">{products.length}</p>
          <p className="text-[10px] text-indigo-600 font-bold">{categories.length} Active Categories</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered Users</p>
          <p className="text-2xl font-extrabold text-slate-900">{users.length}</p>
          <p className="text-[10px] text-slate-500 font-bold">Store Account Holders</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-500 font-bold">
          <p className="animate-pulse">Loading Store Workspace...</p>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {!loading && activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders Overview */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">Recent Customer Activity</h2>
              <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-indigo-600 hover:underline">
                View All Orders &rarr;
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No orders recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">Order #{o.id}</p>
                      <p className="text-[10px] text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Recent'}</p>
                    </div>
                    <span className="font-extrabold text-slate-900">₹{parseFloat(o.total_amount || 0).toFixed(2)}</span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Category Manager */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
            <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">Add Product Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Electronics, Clothing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Optional details"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
              >
                Create Category
              </button>
            </form>

            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Existing Categories ({categories.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <span key={c.id} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[11px] font-bold text-slate-800">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {!loading && activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Publish Product Form */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
            <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">Publish Product with Image 📷</h2>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Wireless Ergonomic Mouse"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="1499"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Stock *</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category (Optional)</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">-- No Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload Image File */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Upload Product Image File 📁
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {imagePreview && (
                  <div className="mt-3 relative rounded-xl overflow-hidden aspect-video border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows="3"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Key features and highlights..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md transition-all hover:scale-[1.01]"
              >
                Upload & Publish Product
              </button>
            </form>
          </div>

          {/* Product Catalog Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">Catalog Items</h2>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 w-48"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                  <img src={getImageUrl(p.image)} alt={p.name} className="w-16 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{p.name}</h3>
                    <p className="text-xs text-indigo-600 font-extrabold mt-0.5">₹{p.price}</p>
                    <p className="text-[10px] text-slate-500">Stock: {p.stock}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setManagingVariantProduct(p)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 px-2.5 py-1 bg-amber-50 rounded-xl border border-amber-200"
                    >
                      Variants ({p.variants?.length || 0}) 👕
                    </button>
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 bg-indigo-50 rounded-xl border border-indigo-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1 bg-rose-50 rounded-xl border border-rose-200"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {!loading && activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'return_rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                  orderStatusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
              <p>No orders found under "{orderStatusFilter}".</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Current Status</th>
                      <th className="px-6 py-4 text-right">Update Order Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {order.user?.username || order.user?.email || order.user || 'Customer'}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-900">
                          ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="return_requested">Return Requested</option>
                            <option value="returned">Returned</option>
                            <option value="return_rejected">Return Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RETURN REQUESTS TAB */}
      {!loading && activeTab === 'returns' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Customer Return & Refund Requests ↩️</h2>
            <p className="text-xs text-slate-500">
              Review items returned by customers, inspect return reasons, approve inventory restocking, and issue official seller response notes.
            </p>
          </div>

          {returnRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
              <p className="text-sm font-bold text-slate-700">No pending return requests! 🎉</p>
              <p className="text-xs text-slate-500 mt-1">When customers submit return requests for delivered orders, they will appear here for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {returnRequests.map((order) => (
                <div key={order.id} className="bg-white border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-indigo-600 text-sm">Order #{order.id}</span>
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          Return Requested
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Customer: <span className="font-bold text-slate-800">{order.user?.username || order.user?.email || order.user || 'Customer'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-slate-900">₹{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{order.payment_method || 'Razorpay'}</p>
                    </div>
                  </div>

                  {/* Customer Reason Box */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-1 text-xs">
                    <p className="font-bold text-amber-900">Customer's Reason for Return:</p>
                    <p className="text-amber-800 italic font-medium">"{order.return_reason || 'No reason specified'}"</p>
                  </div>

                  {/* Purchased Items List */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Items in Order:</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <span key={item.id} className="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl font-bold border border-slate-200">
                            {item.product_name || item.product?.name || 'Product'} × {item.quantity} (₹{item.price})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedReturnOrder(order);
                        setReturnAction('reject');
                        setAdminReturnNote('');
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                    >
                      Reject Return 🔴
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReturnOrder(order);
                        setReturnAction('approve');
                        setAdminReturnNote('');
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                    >
                      Approve & Restock 🟢
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {!loading && activeTab === 'users' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Registered Store Accounts</h2>
            <span className="text-xs font-bold text-slate-500">{users.length} Users Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400">
                      #{u.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {u.username}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_superuser ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          Administrator
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Edit Product #{editingProduct.id}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCESS RETURN MODAL */}
      {selectedReturnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Process Return: Order #{selectedReturnOrder.id}
              </h3>
              <button onClick={() => setSelectedReturnOrder(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 border border-slate-200">
              <p className="font-bold text-slate-800">Customer Reason:</p>
              <p className="text-slate-600 italic">"{selectedReturnOrder.return_reason}"</p>
            </div>

            <form onSubmit={handleProcessReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Action Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnAction('approve')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      returnAction === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Approve Return 🟢
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnAction('reject')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      returnAction === 'reject'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Reject Return 🔴
                  </button>
                </div>
              </div>

              {returnAction === 'approve' && (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-[11px] font-bold border border-emerald-200">
                  ✅ Approving will change status to "Returned" and automatically restock item inventory.
                </div>
              )}

              {returnAction === 'reject' && (
                <div className="bg-rose-50 text-rose-800 p-3 rounded-xl text-[11px] font-bold border border-rose-200">
                  ❌ Rejecting will mark return request as declined.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Response Note (Visible to Customer)
                </label>
                <textarea
                  rows="3"
                  value={adminReturnNote}
                  onChange={(e) => setAdminReturnNote(e.target.value)}
                  placeholder={
                    returnAction === 'approve'
                      ? 'e.g. Return approved. Refund of total order amount initiated.'
                      : 'e.g. Return request declined as product return policy terms were not met.'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReturnOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingReturn}
                  className={`flex-1 py-2.5 font-extrabold text-xs rounded-xl shadow-md text-white transition-all ${
                    returnAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingReturn ? 'Processing...' : returnAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE VARIANTS MODAL */}
      {managingVariantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Manage Variants & Options
                </h3>
                <p className="text-xs text-slate-500">{managingVariantProduct.name}</p>
              </div>
              <button onClick={() => setManagingVariantProduct(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">
                &times;
              </button>
            </div>

            {/* Existing Variants List */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Current Variants ({managingVariantProduct.variants?.length || 0})
              </h4>
              {managingVariantProduct.variants && managingVariantProduct.variants.length > 0 ? (
                <div className="space-y-2">
                  {managingVariantProduct.variants.map((v) => (
                    <div key={v.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-extrabold text-slate-900">{v.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          {v.size && <span className="bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-700">Size: {v.size}</span>}
                          {v.color && <span className="bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-700">Color: {v.color}</span>}
                          <span>Stock: {v.stock}</span>
                          <span>Price: ₹{v.effective_price || v.price_override || managingVariantProduct.price}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVariant(v.id)}
                        className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 text-[11px]"
                      >
                        Remove 🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center text-xs text-slate-500">
                  No variants added yet for this product. Add size or color options below!
                </div>
              )}
            </div>

            {/* Add New Variant Form */}
            <form onSubmit={handleCreateVariant} className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                Add New Size / Color Variant
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Size (e.g. S, M, L, XL, 42)
                  </label>
                  <input
                    type="text"
                    value={newVarSize}
                    onChange={(e) => setNewVarSize(e.target.value)}
                    placeholder="e.g. M"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color (e.g. Black, Navy)
                  </label>
                  <input
                    type="text"
                    value={newVarColor}
                    onChange={(e) => setNewVarColor(e.target.value)}
                    placeholder="e.g. Navy Blue"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price Override (Optional ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(e.target.value)}
                    placeholder={`Default: ₹${managingVariantProduct.price}`}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Variant Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={newVarStock}
                    onChange={(e) => setNewVarStock(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingVariant}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submittingVariant ? 'Creating...' : '+ Save New Variant Option'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;