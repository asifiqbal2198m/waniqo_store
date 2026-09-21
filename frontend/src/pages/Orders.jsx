import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('orders/');
        console.log('Orders response:', response.data);
        if (response.data?.orders) {
          setOrders(response.data.orders);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
        setError('Unable to load orders. Make sure you are signed in.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'return_requested':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'returned':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'return_rejected':
        return 'bg-red-50 text-red-800 border-red-300';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getStatusStepProgress = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { label: 'Processing at Warehouse 🛠️', width: '50%' };
      case 'shipped':
        return { label: 'In Transit / Shipped 📦', width: '75%' };
      case 'delivered':
        return { label: 'Delivered ✅', width: '100%' };
      case 'cancelled':
        return { label: 'Cancelled ❌', width: '0%' };
      case 'return_requested':
        return { label: 'Return Requested ↩️', width: '100%' };
      case 'returned':
        return { label: 'Returned & Refunded 🔄', width: '100%' };
      case 'return_rejected':
        return { label: 'Return Declined ❌', width: '100%' };
      default:
        return { label: 'Order Placed 📝', width: '25%' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order History</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track your previous store purchases and order statuses in real-time.
        </p>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-500 space-y-3">
          <p className="text-base font-bold animate-pulse">Loading your orders...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-600 text-sm font-bold">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mb-6">Your placed orders will appear here for tracking.</p>
          <Link
            to="/products"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all inline-block"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = order.created_at
              ? new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recent Order';

            const itemsCount = order.items ? order.items.length : 0;
            const progress = getStatusStepProgress(order.status);

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-6 transition-all duration-200 shadow-sm hover:shadow-md space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600 uppercase">
                        Order #{order.id}
                      </span>
                      {order.payment_status && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                          {order.payment_status}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Placed on {formattedDate} &bull; <span className="uppercase font-bold text-slate-700">{order.payment_method || 'Razorpay'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status || 'Pending'}
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {order.status?.toLowerCase() !== 'cancelled' && (
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700">
                      <span>Status Tracker: {progress.label}</span>
                      <span className="text-indigo-600">{progress.width}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: progress.width }}
                      />
                    </div>
                  </div>
                )}

                {/* Items Preview & Action */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-700 font-bold">
                      {itemsCount} {itemsCount === 1 ? 'Item' : 'Items'} in this order
                    </p>
                    {order.items && order.items.length > 0 && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {order.items.map((i) => i.product?.name || i.product_name || 'Product').join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/products"
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center gap-1"
                    >
                      <span>★ Rate & Review</span>
                    </Link>
                    {order.status?.toLowerCase() === 'delivered' && (
                      <Link
                        to={`/orders/${order.id}`}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
                      >
                        Request Return ↩️
                      </Link>
                    )}
                    {(order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'confirmed') && (
                      <Link
                        to={`/orders/${order.id}`}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors"
                      >
                        Cancel Order ✖
                      </Link>
                    )}
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors"
                    >
                      Track & View Receipt →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;