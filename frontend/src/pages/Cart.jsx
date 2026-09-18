import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice, clearCart, loading } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay', 'cod'
  const [onlineSubOption, setOnlineSubOption] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay', 'phonepe', 'paytm', 'amazonpay'
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState(null);

  // Promo Code State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  // Form Inputs
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    upiId: '',
    shippingAddress: '',
    city: '',
    pincode: '',
  });

  const handleInputChange = (e) => {
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME10') {
      const discount = totalPrice * 0.1;
      setAppliedDiscount(discount);
      setCouponMsg('🎉 Coupon WELCOME10 applied! 10% discount subtracted.');
    } else if (code === 'SAVE500') {
      if (totalPrice < 1000) {
        setCouponMsg('⚠️ SAVE500 requires a minimum order of ₹1,000.');
        setAppliedDiscount(0);
      } else {
        setAppliedDiscount(500);
        setCouponMsg('🎉 Coupon SAVE500 applied! ₹500 discount subtracted.');
      }
    } else {
      setCouponMsg('❌ Invalid promo code. Try WELCOME10 or SAVE500.');
      setAppliedDiscount(0);
    }
  };

  const finalTotal = Math.max(0, totalPrice - appliedDiscount);
  const freeDeliveryThreshold = 2000;
  const deliveryProgress = Math.min(100, (totalPrice / freeDeliveryThreshold) * 100);

  const handleOpenPaymentModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.isAdmin) {
      alert('Admin accounts are restricted from ordering products. Please sign in with a Customer account to test checkout.');
      return;
    }
    setOrderError('');
    setIsPaymentModalOpen(true);

    // Fetch address in background to prevent modal open delay
    api.get('accounts/profile/').then((res) => {
      const prof = res.data?.profile || res.data?.user || {};
      if (prof.shipping_address) {
        setPaymentDetails((prev) => ({
          ...prev,
          shippingAddress: prev.shippingAddress || prof.shipping_address || '',
          city: prev.city || prof.city || '',
          pincode: prev.pincode || prof.pincode || '',
        }));
      }
    }).catch((err) => {
      console.error('Failed to pre-fill address:', err);
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPlacingOrder(true);
    setOrderError('');

    if (paymentMethod === 'razorpay') {
      try {
        const res = await api.post('orders/create-razorpay-order/');
        const { razorpay_order_id, amount, key_id } = res.data;

        // Check if using demo placeholder key vs real Razorpay dashboard key
        const isDemoKey = !key_id || key_id.endsWith('_demo') || key_id === 'rzp_test_waniqo_store_demo';

        const methodLabel = 'Razorpay Secure Online Payment';

        if (isDemoKey) {
          // Seamless Interactive Test Sandbox (simulates Razorpay payment authorization)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const verifyRes = await api.post('orders/verify-razorpay-payment/', {
            razorpay_payment_id: `pay_test_${Math.floor(100000000 + Math.random() * 900000000)}`,
            razorpay_order_id: razorpay_order_id,
            razorpay_signature: 'test_signature_demo',
            payment_method: methodLabel
          });

          clearCart();
          setIsPaymentModalOpen(false);
          setPaymentSuccessOrder(verifyRes.data.order);
          setPlacingOrder(false);
          return;
        }

        const isLoaded = await loadRazorpayScript();

        if (!isLoaded || !window.Razorpay) {
          setOrderError('Unable to load Razorpay SDK. Please check your internet connection.');
          setPlacingOrder(false);
          return;
        }

        const options = {
          key: key_id,
          amount: Math.round(amount * 100),
          currency: 'INR',
          name: 'Waniqo Store',
          description: 'Official E-Commerce Purchase (Test Mode)',
          order_id: razorpay_order_id,
          handler: async function (response) {
            try {
              setPlacingOrder(true);
              const verifyRes = await api.post('orders/verify-razorpay-payment/', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                payment_method: methodLabel
              });
              clearCart();
              setIsPaymentModalOpen(false);
              setPaymentSuccessOrder(verifyRes.data.order);
            } catch (err) {
              console.error('Payment verification error:', err);
              setOrderError(err.response?.data?.message || 'Payment verification failed.');
            } finally {
              setPlacingOrder(false);
            }
          },
          prefill: {
            name: paymentDetails.cardName || 'Customer',
            email: 'customer@waniqo.com',
            contact: '9876543210'
          },
          theme: {
            color: '#4f46e5'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setOrderError(response.error.description || 'Payment Failed.');
          setPlacingOrder(false);
        });
        rzp.open();
        setPlacingOrder(false);
      } catch (err) {
        console.error('Razorpay order creation error:', err);
        setOrderError(err.response?.data?.message || 'Failed to initiate Razorpay payment.');
        setPlacingOrder(false);
      }
    } else {
      // Standard / COD order processing
      try {
        const response = await api.post('orders/create/');
        const createdOrder = response.data?.order;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        clearCart();
        setIsPaymentModalOpen(false);
        setPaymentSuccessOrder(createdOrder || { id: Date.now(), total_amount: finalTotal });
      } catch (err) {
        console.error('Payment processing error:', err);
        setOrderError(err.response?.data?.message || err.response?.data?.detail || 'Failed to process order.');
      } finally {
        setPlacingOrder(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <p className="text-base font-bold">Loading your shopping cart...</p>
      </div>
    );
  }

  // Payment Success Receipt View
  if (paymentSuccessOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-6 shadow-md animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">Payment Confirmed</span>
            <h1 className="text-3xl font-extrabold text-slate-900">Thank You for Your Order!</h1>
            <p className="text-xs text-slate-600">
              Your payment of <span className="font-bold text-slate-900">₹{parseFloat(paymentSuccessOrder.total_amount || finalTotal).toFixed(2)}</span> was successful.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID:</span>
              <span className="text-indigo-600 font-bold">#{paymentSuccessOrder.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="text-slate-800 uppercase font-bold">{paymentSuccessOrder.payment_method || paymentMethod}</span>
            </div>
            {paymentSuccessOrder.razorpay_payment_id && (
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="text-indigo-600 font-extrabold">{paymentSuccessOrder.razorpay_payment_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className="text-emerald-600 font-bold">
                {paymentSuccessOrder.payment_status ? paymentSuccessOrder.payment_status.toUpperCase() : 'PAID'} ✅
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/orders/${paymentSuccessOrder.id}`}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all text-center"
            >
              View Order Details
            </Link>
            <Link
              to="/products"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review items in your cart and proceed to checkout.
          </p>
        </div>
        {cartItems.length > 0 && !user?.isAdmin && (
          <button
            onClick={clearCart}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Admin Notice Banner */}
      {user?.isAdmin && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🔒
          </div>
          <h2 className="text-lg font-extrabold text-amber-900">Administrator Purchasing Restricted</h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            Admin accounts are reserved for managing store operations, catalog items, and customer order fulfillment. Purchasing items and placing orders is disabled for Admin accounts.
          </p>
          <Link
            to="/admin"
            className="inline-block px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      )}

      {!user?.isAdmin && cartItems.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>
              {totalPrice >= freeDeliveryThreshold
                ? '🎉 You unlocked FREE Express Shipping!'
                : `Add ₹${(freeDeliveryThreshold - totalPrice).toFixed(2)} more for FREE Express Shipping!`}
            </span>
            <span className="text-indigo-600">{deliveryProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${deliveryProgress}%` }}
            />
          </div>
        </div>
      )}

      {!user?.isAdmin && (
        <>
          {cartItems.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Your cart is empty</h3>
              <p className="text-xs text-slate-500 mb-6">Browse our store products and add items to your cart.</p>
              <Link
                to="/products"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all inline-block"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Item List */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const product = item.product || {};
                  const name = item.product_name || product.name || 'Store Item';
                  const price = parseFloat(item.price || product.price || 0);
                  const image = product.image || item.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-indigo-300 shadow-sm"
                    >
                      <img
                        src={image}
                        alt={name}
                        className="w-20 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                      />

                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h3 className="text-base font-extrabold text-slate-900 truncate">{name}</h3>
                        {(item.variant_details || item.variant || item.variant_name) && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded-md border border-indigo-200">
                              Option: {item.variant_details?.name || item.variant?.name || item.variant_name}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-indigo-600 font-bold mt-1">₹{price.toFixed(2)} each</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center font-extrabold text-sm border border-slate-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-extrabold text-slate-900 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center font-extrabold text-sm border border-slate-200 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{(price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Promo Code Coupon Box */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Have a Promo Code? 🏷️</h3>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Try WELCOME10 or SAVE500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all whitespace-nowrap"
                    >
                      Apply Code
                    </button>
                  </form>
                  {couponMsg && (
                    <p className="text-xs font-bold text-slate-700">{couponMsg}</p>
                  )}
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm h-fit space-y-6">
                <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-slate-900">₹{totalPrice.toFixed(2)}</span>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Discount:</span>
                      <span>- ₹{appliedDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Shipping:</span>
                    <span className="text-emerald-600 font-bold">FREE Delivery</span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-lg font-extrabold text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-2xl text-indigo-600">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-amber-700 font-semibold text-center">Please sign in to proceed with checkout.</p>
                    <Link
                      to="/login"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all text-center block"
                    >
                      Sign In to Checkout
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenPaymentModal}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Payment</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Checkout Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Select Payment Method</span>
                  <span className="text-amber-500 text-sm">🔒</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Waniqo Store &bull; Fast & Secure Checkout</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {orderError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl text-center">
                {orderError}
              </div>
            )}

            {/* Amazon / Flipkart Style Payment Option Radio Cards */}
            <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Delivery Address Section */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Delivery Address</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 uppercase tracking-wider font-extrabold">Step 1 of 2</span>
                </div>
                <input
                  type="text"
                  required
                  name="shippingAddress"
                  value={paymentDetails.shippingAddress}
                  onChange={handleInputChange}
                  placeholder="Enter house/street address, city, pincode"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
                />
              </div>

              {/* Payment Methods Section Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Select Payment Option</span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>🔒 256-Bit SSL Encrypted</span>
                </span>
              </div>

              {/* Option 1: Razorpay (Amazon / Flipkart Online Payment Card) */}
              <div
                className={`border rounded-2xl p-4 transition-all duration-200 ${
                  paymentMethod === 'razorpay'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  onClick={() => setPaymentMethod('razorpay')}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        Razorpay Secure Online Payment
                      </span>
                      <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pay via Google Pay, PhonePe, Paytm, Credit/Debit Cards, or NetBanking.
                    </p>
                  </div>
                </div>

                {/* Sub-options Info for Online Payment */}
                {paymentMethod === 'razorpay' && (
                  <div className="mt-3 pt-3 border-t border-indigo-200/60 space-y-2">
                    <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-indigo-900 text-xs space-y-1 text-left">
                      <p className="font-extrabold flex items-center gap-1.5 text-indigo-800">
                        <span>💳</span>
                        <span>Official Razorpay Payment Gateway</span>
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Clicking <strong>"Proceed to Pay ₹{finalTotal.toFixed(2)}"</strong> will open the secure Razorpay window to select your preferred payment method: <strong>Google Pay, PhonePe, Paytm, Credit/Debit Cards, NetBanking, or Wallets</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Cash on Delivery (COD Card) */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`block cursor-pointer border rounded-2xl p-4 transition-all duration-200 ${
                  paymentMethod === 'cod'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentOption"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-slate-900">Cash on Delivery (COD)</span>
                      <span className="text-xs text-slate-500 font-bold">Pay at Doorstep</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pay using Cash or UPI to the delivery agent upon item delivery.
                    </p>
                  </div>
                </div>
              </label>

              {/* Order Summary Breakdown Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({cartItems.length} items):</span>
                  <span className="font-bold text-slate-900">₹{totalPrice.toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount Applied:</span>
                    <span>-₹{appliedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee:</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>Total Amount Payable:</span>
                  <span className="text-xl text-indigo-600 font-black">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Primary Amazon/Flipkart CTA Button */}
              <button
                type="submit"
                disabled={placingOrder}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                {placingOrder ? (
                  <span className="animate-pulse">Processing Order...</span>
                ) : (
                  <span>Place Your Order & Pay ₹{finalTotal.toFixed(2)}</span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 font-medium">
                By placing your order, you agree to Waniqo Store Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;