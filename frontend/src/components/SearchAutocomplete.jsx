import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getMediaUrl as getImageUrl } from '../services/api';

function SearchAutocomplete({ onSelectProduct }) {
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('products/').then((res) => {
      const items = res.data?.products || (Array.isArray(res.data) ? res.data : []);
      setAllProducts(items);
    }).catch((err) => console.error('Autocomplete fetch error:', err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);

    if (text.trim().length > 0) {
      const filtered = allProducts.filter((p) =>
        p.name.toLowerCase().includes(text.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(text.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(text.toLowerCase()))
      ).slice(0, 5);

      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (product) => {
    setQuery('');
    setIsOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate('/products');
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          placeholder="Search items or categories..."
          className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 pl-9 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
        />
        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Autocomplete Dropdown Panel */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn divide-y divide-slate-100">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full text-left p-3 hover:bg-indigo-50/70 transition-colors flex items-center gap-3 group"
            >
              <img
                src={getImageUrl(item.image)}
                alt={item.name}
                className="w-10 h-10 object-cover rounded-lg bg-slate-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] font-extrabold text-indigo-600">₹{item.price}</span>
                  <span className="text-[10px] text-amber-500 font-bold">⭐ {item.average_rating || 5.0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
