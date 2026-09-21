import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import SearchAutocomplete from './SearchAutocomplete';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Vibrant Announcement Ticker */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 text-white text-[11px] sm:text-xs font-bold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-sm animate-gradientShift">
        <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest flex-shrink-0">
          ✨ Special Offer
        </span>
        <span className="truncate">Get 10% OFF on your first order! Use code <strong className="underline decoration-amber-300 font-black">WELCOME10</strong> &bull; 🚚 Free Express Shipping</span>
      </div>

      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none py-2 flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="hidden lg:block">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
              Waniqo Store
            </span>
            <span className="text-[10px] block text-indigo-600 font-bold tracking-widest uppercase -mt-0.5">
              Friendly Shopping
            </span>
          </div>
        </Link>

        {/* Global Live Search Autocomplete */}
        <div className="hidden sm:block flex-1 max-w-xs">
          <SearchAutocomplete />
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
          <Link
            to="/"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/')
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Home
          </Link>
          <Link
            to="/products"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isActive('/products')
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Products
          </Link>
          {isAuthenticated && !user?.isAdmin && (
            <>
              <Link
                to="/wishlist"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/wishlist')
                    ? 'bg-white text-rose-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-white/60'
                }`}
              >
                Wishlist ❤️
              </Link>
              <Link
                to="/orders"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive('/orders') || location.pathname.startsWith('/orders/')
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                My Orders
              </Link>
            </>
          )}

          {/* Admin Dashboard ONLY visible if user is authenticated AND user.isAdmin === true */}
          {isAuthenticated && user?.isAdmin && (
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive('/admin')
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Right Actions: Cart & Auth */}
        <div className="flex items-center gap-3">
          {/* Cart Icon & Badge */}
          <Link
            to="/cart"
            className="relative p-3 bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-2xl text-slate-700 hover:text-indigo-600 transition-all duration-200 group focus:outline-none"
            aria-label="Shopping Cart"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-indigo-600/30">
                {totalCount}
              </span>
            )}
          </Link>

          {/* User Auth Info / Login Buttons */}
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
              <Link to="/profile" className="text-right hover:opacity-80 transition-opacity">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                  👤 {user?.username || 'Profile'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">{user?.isAdmin ? 'Admin' : 'My Account'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          <SearchAutocomplete />
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            to="/products"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Products
          </Link>
          {isAuthenticated && (
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              My Profile 👤
            </Link>
          )}
          {isAuthenticated && !user?.isAdmin && (
            <>
              <Link
                to="/wishlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Wishlist ❤️
              </Link>
              <Link
                to="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                My Orders
              </Link>
            </>
          )}
          {isAuthenticated && user?.isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-amber-700 hover:bg-amber-50"
            >
              Admin Dashboard
            </Link>
          )}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {isAuthenticated ? (
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left text-sm font-bold text-rose-600 py-2"
              >
                Sign Out ({user?.username})
              </button>
            ) : (
              <div className="flex w-full gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </nav>
    </>
  );
}

export default Navbar;