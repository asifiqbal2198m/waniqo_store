import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl as getImageUrl, getProductFallbackImage } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const HERO_SLIDES = [
  {
    badge: '🔥 Spring Tech & Lifestyle Sale',
    title: 'Elevate Your Digital Life with Waniqo Store',
    desc: 'Discover authentic smartphones, high-resolution audio, laptops, workspace gear, and daily lifestyle essentials.',
    ctaText: 'Explore Products 🚀',
    ctaLink: '/products',
    gradient: 'from-violet-950 via-indigo-900 to-slate-950',
    accentColor: 'text-amber-400',
  },
  {
    badge: '🏷️ Instant ₹500 Discount',
    title: 'Use Coupon Code WELCOME10 for 10% OFF',
    desc: 'Apply promo code WELCOME10 at checkout or SAVE500 on orders over ₹1,000 for instant savings.',
    ctaText: 'Use Discount Code 🛍️',
    ctaLink: '/products',
    gradient: 'from-indigo-950 via-purple-950 to-indigo-900',
    accentColor: 'text-emerald-400',
  },
  {
    badge: '🚚 Fast Express Shipping',
    title: 'Free Doorstep Delivery Across All Cities',
    desc: 'Enjoy rapid order dispatch, live shipment status tracking, and 7-day hassle-free return guarantees.',
    ctaText: 'Shop Best Sellers ⭐',
    ctaLink: '/products',
    gradient: 'from-slate-950 via-indigo-950 to-violet-900',
    accentColor: 'text-indigo-400',
  },
];

const CATEGORY_CARDS = [
  {
    name: 'Electronics & Laptops',
    icon: '💻',
    tagline: 'High Performance Laptops & Gear',
    gradient: 'from-indigo-600 via-indigo-700 to-violet-800',
    border: 'border-indigo-400/40',
    shadow: 'shadow-indigo-500/20',
  },
  {
    name: 'Mobiles & Gadgets',
    icon: '📱',
    tagline: 'Smartphones & Smartwear',
    gradient: 'from-violet-600 via-purple-600 to-pink-600',
    border: 'border-purple-400/40',
    shadow: 'shadow-purple-500/20',
  },
  {
    name: 'Audio & Headphones',
    icon: '🎧',
    tagline: 'Studio Quality Sound & Wireless',
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    border: 'border-amber-400/40',
    shadow: 'shadow-amber-500/20',
  },
  {
    name: 'Fashion & Wearables',
    icon: '👕',
    tagline: 'Trendy Apparel & Accessories',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    border: 'border-emerald-400/40',
    shadow: 'shadow-emerald-500/20',
  },
];

const FEATURES = [
  {
    title: 'Express Doorstep Delivery',
    desc: 'Fast, safe & friendly shipping straight to your address with live status updates.',
    gradient: 'from-indigo-500 to-violet-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: '100% Authentic Guarantee',
    desc: 'Handpicked products tested for maximum quality and durability.',
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Secure Online & COD Payments',
    desc: 'Protected authentication, Razorpay cards/UPI, and Cash on Delivery options.',
    gradient: 'from-violet-500 to-purple-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Friendly 24/7 Care',
    desc: 'Our customer support team is always here to assist you before and after purchase.',
    gradient: 'from-amber-500 to-orange-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

const Home = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Auto-play Carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Fetch Featured Products from PostgreSQL backend
  useEffect(() => {
    api.get('products/')
      .then((res) => {
        const list = res.data?.products || (Array.isArray(res.data) ? res.data : []);
        setFeaturedProducts(list.slice(0, 4));
      })
      .catch((err) => console.error('Failed to load featured products:', err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleAddToCart = async (product) => {
    if (user?.isAdmin) {
      setToastMsg('🔒 Admin accounts cannot purchase items.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    const res = await addToCart(product, 1);
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-16 py-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-indigo-400/30">
          <span className="font-bold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* VIBRANT DYNAMIC HERO BANNER CAROUSEL */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 min-h-[440px] flex items-center border border-white/20">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} p-8 sm:p-16 flex flex-col justify-center transition-all duration-700 ${
                idx === currentSlide
                  ? 'opacity-100 translate-x-0 z-10 pointer-events-auto'
                  : 'opacity-0 translate-x-12 z-0 pointer-events-none'
              }`}
            >
              {/* Vibrant Ambient Glowing Orbs */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl pointer-events-none animate-floatOrb" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none animate-floatOrb" />

              <div className="relative z-10 max-w-2xl text-white space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white/15 text-indigo-100 backdrop-blur-md border border-white/25 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  {slide.badge}
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                  {slide.title}
                </h1>

                <p className="text-indigo-100 text-xs sm:text-base leading-relaxed font-medium">
                  {slide.desc}
                </p>

                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <Link
                    to={slide.ctaLink}
                    className="px-7 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2"
                  >
                    <span>{slide.ctaText}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-bold text-white">
                    <span>🎁 Promo:</span>
                    <span className="font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-black">WELCOME10</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Controls */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-4 z-20 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all border border-white/25 focus:outline-none"
            aria-label="Previous Slide"
          >
            &#10094;
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-4 z-20 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all border border-white/25 focus:outline-none"
            aria-label="Next Slide"
          >
            &#10095;
          </button>

          {/* Slide Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-8 bg-amber-400 shadow-md' : 'w-2.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* COLORFUL CATEGORY CARDS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Popular Categories 🛍️
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Shop by category for handpicked technology and lifestyle products</p>
          </div>
          <Link to="/products" className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All Categories &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORY_CARDS.map((cat, idx) => (
            <Link
              key={idx}
              to="/products"
              className={`group relative bg-gradient-to-br ${cat.gradient} p-6 rounded-3xl text-white overflow-hidden shadow-lg ${cat.shadow} border ${cat.border} transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between h-44`}
            >
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-20 group-hover:scale-125 transition-transform duration-500 pointer-events-none">
                {cat.icon}
              </div>

              <div className="space-y-1 z-10">
                <span className="text-3xl">{cat.icon}</span>
                <h3 className="text-lg font-black tracking-tight">{cat.name}</h3>
                <p className="text-xs text-white/80 font-medium">{cat.tagline}</p>
              </div>

              <div className="z-10 flex items-center gap-1 text-xs font-extrabold text-amber-300 group-hover:translate-x-1 transition-transform">
                <span>Shop Collection</span>
                <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VIBRANT FEATURE HIGHLIGHTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 hover:border-indigo-300 p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1.5">{feature.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED & TOP RATED PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-full">
              ⭐ Handpicked Selection
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Featured Products & Best Sellers
            </h2>
          </div>
          <Link to="/products" className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Browse All Products &rarr;
          </Link>
        </div>

        {loadingProducts ? (
          <div className="text-center py-12 text-slate-400 font-bold animate-pulse">
            Loading trending items...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-slate-200/80 hover:border-indigo-400 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={getImageUrl(product.image, product.name)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getProductFallbackImage(product.name);
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-900 font-extrabold text-[10px] rounded-full shadow-sm flex items-center gap-1">
                    <span className="text-amber-400">⭐</span> {product.average_rating || 5.0}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'High quality store item with fast shipping.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-black text-slate-900">₹{product.price}</span>
                      <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        In Stock ({product.stock})
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || user?.isAdmin}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-200 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all"
                    >
                      {user?.isAdmin ? '🔒 Admin Mode' : 'Add to Cart 🛒'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VIBRANT CTA PROMO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-amber-600 rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl border border-white/20 animate-gradientShift">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-amber-200">
              🚀 Join Waniqo Store Today
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready for a Colorful & Premium Shopping Experience?
            </h2>
            <p className="text-indigo-100 text-xs sm:text-base leading-relaxed font-medium">
              Enjoy authentic items, fast doorstep shipping across India, and friendly 24/7 customer support.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-9 py-4 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <span>Start Shopping Catalog</span>
                <span className="text-indigo-600">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;