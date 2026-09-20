import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl as getImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Wishlist() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('products/wishlist/');
      console.log('Wishlist items response:', response.data);
      const items = response.data?.products || [];
      setWishlistItems(items);
    } catch (err) {
      console.error('Fetch wishlist error:', err);
      setError('Unable to load your saved favorites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await api.post(`products/${productId}/wishlist/`);
      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
      setToastMessage('Item removed from Wishlist.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Remove wishlist error:', err);
    }
  };

  const handleMoveToCart = async (product) => {
    if (user?.isAdmin) {
      setToastMessage('🔒 Admin accounts cannot purchase items.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    const res = await addToCart(product, 1);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-indigo-400/30">
          <span className="font-bold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Wishlist ❤️</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Your saved favorite items. Move them to your cart whenever you are ready!
          </p>
        </div>
        <span className="px-4 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-full">
          {wishlistItems.length} Saved Items
        </span>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-500 font-bold animate-pulse">
          Loading your saved favorites...
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <p className="text-rose-600 font-bold text-xs">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {wishlistItems.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                ❤️
              </div>
              <h3 className="text-lg font-bold text-slate-900">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500">Explore our catalog and click the heart icon on any product to save it here.</p>
              <Link
                to="/products"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-block"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80";
                      }}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md text-rose-600 hover:bg-rose-50 rounded-full shadow-sm border border-slate-200/60 transition-transform active:scale-90"
                      title="Remove from Wishlist"
                    >
                      ❤️
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base truncate">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description || 'High quality store item.'}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold text-slate-900">₹{product.price}</span>
                        <span className="text-[11px] text-slate-500">Stock: {product.stock}</span>
                      </div>

                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={product.stock === 0 || user?.isAdmin}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Move to Cart 🛒
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Wishlist;
