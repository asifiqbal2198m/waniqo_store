import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl as getImageUrl, getProductFallbackImage } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const HERO_SLIDES = [
  {
    badge: '🚀 New Season Tech & Gear',
    title: 'Elevate Your Digital Life with Premium Products',
    desc: 'Discover handpicked smartphones, high-resolution audio, ergonomic workspace gear, and daily lifestyle essentials.',
    ctaText: 'Explore Catalog',
    ctaLink: '/products',
    gradient: 'from-indigo-950 via-indigo-900 to-violet-950',
    accentColor: 'text-indigo-400',
  },
  {
    badge: '🏷️ Exclusive Promo Savings',
    title: 'Get 10% Off Your Order with Code WELCOME10',
    desc: 'Use coupon code WELCOME10 at checkout or SAVE500 on orders over ₹1,000 for instant doorstep savings.',
    ctaText: 'Use Discount Code',
    ctaLink: '/cart',
    gradient: 'from-violet-950 via-indigo-900 to-slate-900',
    accentColor: 'text-emerald-400',
  },
  {
    badge: '🚚 Fast Doorstep Delivery',
    title: 'Free Express Shipping on Orders Over ₹2,000',
    desc: 'Enjoy fast dispatch, real-time shipment tracking timeline, and safe doorstep delivery across all cities.',
    ctaText: 'Shop Best Sellers',
    ctaLink: '/products',
    gradient: 'from-slate-900 via-indigo-950 to-indigo-900',
    accentColor: 'text-amber-400',
  },
];

const FEATURES = [
  {
    title: 'Express Doorstep Delivery',
    desc: 'Fast, safe & friendly shipping straight to your address.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Quality You Can Trust',
    desc: 'Handpicked products tested for maximum satisfaction.',
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Safe & Secure Shopping',
    desc: 'Protected authentication and instant status notifications.',
    icon: (
      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Friendly 24/7 Support',
    desc: 'Our customer support team is always here to assist you.',
    icon: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
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

      {/* DYNAMIC HERO BANNER CAROUSEL */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 min-h-[420px] flex items-center">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} p-8 sm:p-16 flex flex-col justify-center transition-all duration-700 ${
                idx === currentSlide
                  ? 'opacity-100 translate-x-0 z-10 pointer-events-auto'
                  : 'opacity-0 translate-x-12 z-0 pointer-events-none'
              }`}
            >
              {/* Ambient Shapes */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl text-white space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-white/15 text-indigo-100 backdrop-blur-md border border-white/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  {slide.badge}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  {slide.title}
                </h1>

                <p className="text-indigo-100 text-xs sm:text-base leading-relaxed">
                  {slide.desc}
                </p>

                <div className="pt-4 flex items-center gap-4">
                  <Link
                    to={slide.ctaLink}
                    className="px-7 py-3.5 bg-white hover:bg-slate-100 text-indigo-950 font-extrabold rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2"
                  >
                    <span>{slide.ctaText}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-4 z-20 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all border border-white/20 focus:outline-none"
            aria-label="Previous Slide"
          >
            &#10094;
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-4 z-20 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all border border-white/20 focus:outline-none"
            aria-label="Next Slide"
          >
            &#10095;
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 hover:border-indigo-300 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{feature.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED & TOP RATED PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Featured & Top Rated 🌟</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Trending products loved by Waniqo Store customers</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Browse All Products →
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
                className="group bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg flex flex-col justify-between"
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
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[10px] rounded-full shadow-sm">
                    ⭐ {product.average_rating || 5.0}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'High quality store item.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-extrabold text-slate-900">₹{product.price}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Stock: {product.stock}</span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || user?.isAdmin}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs shadow-md transition-all"
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

      {/* CTA Promo Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-4">
            Ready for a Smooth & Friendly Shopping Experience?
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Join thousands of happy customers who enjoy authentic items, fast doorstep delivery, and dedicated customer care.
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-3.5 bg-white text-indigo-950 hover:bg-slate-100 font-extrabold text-sm rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Start Shopping Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;