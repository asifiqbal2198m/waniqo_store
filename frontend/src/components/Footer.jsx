import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-20 relative overflow-hidden">
      {/* Top Colorful Accent Line */}
      <div className="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 via-pink-500 to-amber-500 w-full animate-gradientShift" />

      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
                W
              </div>
              <span className="text-xl font-black text-white tracking-tight bg-gradient-to-r from-white via-indigo-100 to-amber-300 bg-clip-text text-transparent">
                Waniqo Store
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Your colorful destination for authentic electronics, modern smartphones, studio audio, and daily lifestyle essentials.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase rounded-full">
                🔒 SSL Encrypted
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black uppercase rounded-full">
                ⚡ 24h Express
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Quick Navigation</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/" className="hover:text-amber-300 transition-colors">⚡ Home</Link></li>
              <li><Link to="/products" className="hover:text-amber-300 transition-colors">🛍️ Browse Product Catalog</Link></li>
              <li><Link to="/cart" className="hover:text-amber-300 transition-colors">🛒 Shopping Cart & Checkout</Link></li>
              <li><Link to="/orders" className="hover:text-amber-300 transition-colors">📦 Order Tracking Timeline</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Customer Support</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>💬 24/7 Dedicated Customer Care</li>
              <li>🚚 Free Shipping Across India</li>
              <li>↩️ 7-Day Easy Return Policy</li>
              <li>💳 Secure Razorpay & COD Payments</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Exclusive Deals</h4>
            <p className="text-xs text-slate-400 font-medium">Get secret promo codes and new product launch notifications.</p>
            <div className="flex gap-2 pt-1">
              <input
                type="email"
                placeholder="Your email address..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full placeholder:text-slate-500 font-medium"
              />
              <button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs px-4 py-2.5 rounded-xl font-black transition-all shadow-md shadow-amber-500/20">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Waniqo Store. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-indigo-400 font-bold">💳 Razorpay Online</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-bold">💵 Cash on Delivery</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-bold">⭐ 4.9/5 Rating</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
