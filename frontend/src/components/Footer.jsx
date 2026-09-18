import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200/80 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/20">
                W
              </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">Waniqo Store</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your friendly destination for high-quality electronics, modern workspace gear, and daily lifestyle essentials.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-indigo-600 transition-colors">Browse Catalog</Link></li>
              <li><Link to="/cart" className="hover:text-indigo-600 transition-colors">Shopping Cart</Link></li>
              <li><Link to="/orders" className="hover:text-indigo-600 transition-colors">Order Tracking</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Customer Support</h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-500">24/7 Friendly Assistance</li>
              <li className="text-slate-500">Fast Doorstep Delivery</li>
              <li className="text-slate-500">30-Day Easy Returns</li>
              <li className="text-slate-500">Privacy & Terms</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Stay Updated</h4>
            <p className="text-xs text-slate-500 mb-3">Get notified about friendly discounts and new arrivals.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address..."
                className="bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 w-full"
              />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-colors shadow-sm">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Waniqo Store. Built with ❤️ for a friendly shopping experience.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
