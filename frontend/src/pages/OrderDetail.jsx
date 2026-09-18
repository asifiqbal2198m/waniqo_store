import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReasonSelect, setReturnReasonSelect] = useState('Damaged or defective item');
  const [customReturnReason, setCustomReturnReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`orders/${orderId}/`);
      console.log('Order detail response:', response.data);
      if (response.data?.order) {
        setOrder(response.data.order);
      } else {
        setOrder(response.data);
      }
    } catch (err) {
      console.error('Fetch order detail error:', err);
      setError('Unable to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`orders/${orderId}/cancel/`, {
        reason: cancelReason.trim() || 'Cancelled by customer',
      });
      console.log('Cancel order response:', res.data);
      setMsg('Order cancelled successfully. Restocked inventory back to store.');
      setShowCancelModal(false);
      setCancelReason('');
      fetchOrderDetail();
    } catch (err) {
      console.error('Cancel order error:', err);
      const data = err.response?.data;
      setError(data?.message || data?.detail || 'Failed to cancel order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const finalReason = returnReasonSelect === 'Other'
      ? customReturnReason.trim()
      : `${returnReasonSelect}${customReturnReason.trim() ? `: ${customReturnReason.trim()}` : ''}`;

    if (!finalReason) {
      setError('Please provide a reason for requesting a return.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post(`orders/${orderId}/return/`, {
        reason: finalReason,
      });
      console.log('Request return response:', res.data);
      setMsg('Return request submitted successfully. Awaiting seller approval.');
      setShowReturnModal(false);
      setCustomReturnReason('');
      fetchOrderDetail();
    } catch (err) {
      console.error('Request return error:', err);
      const data = err.response?.data;
      setError(data?.message || data?.detail || 'Failed to submit return request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-base font-bold animate-pulse">Loading order status and tracking timeline...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-rose-600 font-bold">{error || 'Order not found.'}</p>
        <Link to="/orders" className="text-indigo-600 underline text-xs font-bold">
          Back to Order History
        </Link>
      </div>
    );
  }

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recent Order';

  const orderDateObj = order.created_at ? new Date(order.created_at) : new Date();
  const estDeliveryDate = new Date(orderDateObj);
  estDeliveryDate.setDate(estDeliveryDate.getDate() + 4);
  const formattedEstDelivery = estDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📝', desc: 'Order received & queued' },
    { key: 'confirmed', label: 'Confirmed', icon: '🛠️', desc: 'Processing at warehouse' },
    { key: 'shipped', label: 'Shipped', icon: '📦', desc: 'Handed over to courier' },
    { key: 'delivered', label: 'Delivered', icon: '✅', desc: 'Delivered to doorstep' },
  ];

  const statusOrderIndexMap = {
    pending: 1,
    confirmed: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 0,
    return_requested: 4,
    returned: 4,
    return_rejected: 4,
  };

  const currentStepNumber = statusOrderIndexMap[order.status?.toLowerCase()] || 1;
  const isCancelled = order.status?.toLowerCase() === 'cancelled';
  const isDelivered = order.status?.toLowerCase() === 'delivered';
  const isPendingOrConfirmed = order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'confirmed';
  const isReturnRequested = order.status?.toLowerCase() === 'return_requested';
  const isReturned = order.status?.toLowerCase() === 'returned';
  const isReturnRejected = order.status?.toLowerCase() === 'return_rejected';

  const getStatusBadgeStyle = (status) => {
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

  const getStatusDisplayLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'return_requested':
        return 'Return Requested ↩️';
      case 'returned':
        return 'Returned & Refunded 🔄';
      case 'return_rejected':
        return 'Return Declined ❌';
      case 'cancelled':
        return 'Cancelled ❌';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:py-0 print:px-0">
      {/* Messages */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-sm font-bold flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-600 hover:text-emerald-900 font-extrabold text-xs">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900 font-extrabold text-xs">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 print:border-b-2 print:border-black">
        <div>
          <Link to="/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 block mb-2 print:hidden">
            ← Back to Order History
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Invoice #{order.id}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Placed on {formattedDate} &bull; Waniqo Store Official Receipt</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${getStatusBadgeStyle(order.status)} print:border-slate-400`}>
            Status: {getStatusDisplayLabel(order.status)}
          </span>

          <button
            onClick={handlePrintReceipt}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all print:hidden flex items-center gap-1.5"
          >
            <span>📄 Print / Save PDF Receipt</span>
          </button>
        </div>
      </div>

      {/* ACTION BANNER / BUTTONS (CANCEL & RETURN) */}
      <div className="print:hidden">
        {isPendingOrConfirmed && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <p className="text-xs font-bold text-amber-900">Need to cancel this order?</p>
              <p className="text-[11px] text-amber-700">You can cancel pending or confirmed orders before they are shipped. Stock will be restored.</p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex-shrink-0"
            >
              Cancel Order ✖
            </button>
          </div>
        )}

        {isDelivered && (
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <p className="text-xs font-bold text-indigo-900">Delivered Order — Request Return or Refund</p>
              <p className="text-[11px] text-indigo-700">Not satisfied with your product? You can request a return within 7 days of delivery.</p>
            </div>
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex-shrink-0"
            >
              Request Return ↩️
            </button>
          </div>
        )}

        {isReturnRequested && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 space-y-1 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">⏳</span>
              <p className="text-xs font-extrabold">Return Request Under Admin Review</p>
            </div>
            <p className="text-xs text-amber-800">
              <span className="font-bold">Your Return Reason:</span> "{order.return_reason}"
            </p>
            <p className="text-[11px] text-amber-700">Our store manager will review your request shortly.</p>
          </div>
        )}

        {isReturned && (
          <div className="bg-teal-50 border border-teal-300 rounded-2xl p-4 text-teal-900 space-y-1 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <p className="text-xs font-extrabold">Return Approved & Refund Processed</p>
            </div>
            {order.return_reason && (
              <p className="text-xs text-teal-800">
                <span className="font-bold">Return Reason:</span> "{order.return_reason}"
              </p>
            )}
            {order.admin_note && (
              <p className="text-xs text-teal-900 bg-teal-100/70 p-2 rounded-lg font-mono mt-1">
                <span className="font-bold">Store Admin Note:</span> {order.admin_note}
              </p>
            )}
          </div>
        )}

        {isReturnRejected && (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-rose-900 space-y-1 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">❌</span>
              <p className="text-xs font-extrabold">Return Request Declined</p>
            </div>
            {order.return_reason && (
              <p className="text-xs text-rose-800">
                <span className="font-bold">Your Reason:</span> "{order.return_reason}"
              </p>
            )}
            {order.admin_note && (
              <p className="text-xs text-rose-900 bg-rose-100/70 p-2 rounded-lg font-mono mt-1">
                <span className="font-bold">Admin Response:</span> {order.admin_note}
              </p>
            )}
          </div>
        )}

        {isCancelled && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 space-y-1 shadow-sm">
            <p className="font-extrabold text-xs">Order Cancelled ❌</p>
            {order.cancel_reason && (
              <p className="text-xs text-rose-700">
                <span className="font-bold">Reason:</span> "{order.cancel_reason}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* REAL-TIME ORDER TRACKING VISUAL TIMELINE */}
      {!isCancelled && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Real-Time Order Tracker 🚚</h2>
              <p className="text-xs text-slate-500">Live order fulfillment status from warehouse to doorstep.</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-3.5 py-1.5 rounded-2xl font-bold w-fit">
              Estimated Delivery: <span className="font-extrabold">{formattedEstDelivery}</span>
            </div>
          </div>

          {/* Stepper Line & Pills */}
          <div className="relative pt-4 pb-2">
            {/* Progress Bar Background */}
            <div className="hidden sm:block absolute top-10 left-[10%] right-[10%] h-1 bg-slate-100 rounded-full z-0">
              <div
                className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                style={{
                  width: `${((currentStepNumber - 1) / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Stepper Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-0 relative z-10">
              {statusSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = currentStepNumber >= stepNum;
                const isCurrent = currentStepNumber === stepNum;

                return (
                  <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-indigo-600 text-white shadow-indigo-600/30 scale-105'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                    >
                      {isCompleted ? step.icon : stepNum}
                    </div>

                    <div>
                      <p className={`text-xs font-extrabold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Items Breakdown Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 print:border-0 print:p-0">
        <h2 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">Purchased Items</h2>

        <div className="space-y-4">
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => {
              const product = item.product || {};
              const productName = item.product_name || product.name || 'Product';
              const price = parseFloat(item.price || product.price || 0);
              const qty = item.quantity || 1;
              const image = product.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

              return (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                  <img src={image} alt={productName} className="w-16 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0 print:hidden" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{productName}</h3>
                    {(item.variant_name || item.variant_details?.name || item.variant?.name) && (
                      <div className="mt-0.5">
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded-md border border-indigo-200">
                          Option: {item.variant_name || item.variant_details?.name || item.variant?.name}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">Qty: {qty} × ₹{price.toFixed(2)}</p>
                  </div>
                  <div className="text-right text-base font-extrabold text-slate-900">
                    ₹{(price * qty).toFixed(2)}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500">No item breakdown available.</p>
          )}
        </div>

        {/* Payment Metadata */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-mono space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Payment Gateway:</span>
            <span className="font-bold text-slate-800 uppercase">{order.payment_method || 'Razorpay'}</span>
          </div>
          {order.razorpay_payment_id && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Razorpay Transaction ID:</span>
              <span className="font-extrabold text-indigo-600">{order.razorpay_payment_id}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Payment Status:</span>
            <span className="font-bold text-emerald-600">
              {order.payment_status ? order.payment_status.toUpperCase() : 'PAID'} ✅
            </span>
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-lg font-extrabold text-slate-900">
          <span>Total Amount Paid:</span>
          <span className="text-2xl text-indigo-600">₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* CANCEL ORDER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Cancel Order #{order.id}?</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows="3"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed my mind, found lower price elsewhere, ordered by mistake..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-[11px] font-bold">
                ⚠️ Confirming cancellation will return item stock to store inventory.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Request Return for Order #{order.id}</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleRequestReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Reason for Return *
                </label>
                <select
                  value={returnReasonSelect}
                  onChange={(e) => setReturnReasonSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3"
                >
                  <option value="Damaged or defective item">Damaged or defective item</option>
                  <option value="Wrong product delivered">Wrong product delivered</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Size or fit issue">Size or fit issue</option>
                  <option value="Other">Other (specify below)</option>
                </select>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Details / Explanation
                </label>
                <textarea
                  rows="3"
                  value={customReturnReason}
                  onChange={(e) => setCustomReturnReason(e.target.value)}
                  placeholder="Provide additional context for the store admin..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-xl text-[11px] font-bold">
                ℹ️ Once submitted, store admin will review and process your return request.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;