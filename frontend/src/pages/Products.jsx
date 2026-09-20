import { useEffect, useState } from "react";
import api, { getMediaUrl as getImageUrl } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import SearchAutocomplete from "../components/SearchAutocomplete";

function Products() {
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceBracket, setSelectedPriceBracket] = useState("all"); // 'all', 'under1k', '1k-5k', '5k-25k', 'above25k'
  const [sortBy, setSortBy] = useState("newest");
  const [toastMessage, setToastMessage] = useState("");

  // Wishlist State
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Quick View Modal & Review Submission State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    setModalQty(1);
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("products/").catch(() => ({ data: { products: [] } })),
        api.get("products/categories/").catch(() => ({ data: { categories: [] } })),
      ]);

      const loadedProducts = prodRes.data?.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
      setProducts(loadedProducts);

      const loadedCategories = catRes.data?.categories || [];
      setCategories(loadedCategories);

      if (isAuthenticated && !user?.isAdmin) {
        api.get("products/wishlist/").then((res) => {
          const ids = new Set((res.data?.products || []).map((p) => p.id));
          setWishlistIds(ids);
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Products fetch error:", err);
      setError("Unable to load store products. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user]);

  const handleToggleWishlist = async (product, e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      setToastMessage("Please sign in to save items to your wishlist.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }
    if (user?.isAdmin) {
      setToastMessage("🔒 Admin accounts cannot save items to wishlist.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    try {
      const res = await api.post(`products/${product.id}/wishlist/`);
      setToastMessage(res.data?.message || "Wishlist updated!");
      setTimeout(() => setToastMessage(""), 3000);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (next.has(product.id)) next.delete(product.id);
        else next.add(product.id);
        return next;
      });
    } catch (err) {
      console.error("Wishlist toggle error:", err);
    }
  };

  const handleAddToCart = async (product, quantity = 1, variant = null) => {
    if (user?.isAdmin) {
      setToastMessage("🔒 Admin accounts cannot purchase items. Please log in as a customer.");
      setTimeout(() => setToastMessage(""), 4000);
      return;
    }
    
    let targetVariant = variant;
    if (!targetVariant && product.variants && product.variants.length > 0) {
      targetVariant = product.variants[0];
    }

    const res = await addToCart(product, quantity, targetVariant);
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(""), 3000);
    if (quickViewProduct) setQuickViewProduct(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!quickViewProduct) return;
    setSubmittingReview(true);
    setReviewSuccessMsg("");

    try {
      const response = await api.post(`products/${quickViewProduct.id}/reviews/create/`, {
        rating: newRating,
        comment: newComment,
      });

      setReviewSuccessMsg(response.data?.message || "Review submitted successfully!");
      setNewComment("");
      setTimeout(() => setReviewSuccessMsg(""), 3500);

      // Refresh product list and update current modal product
      const updatedRes = await api.get("products/");
      const updatedProducts = updatedRes.data?.products || [];
      setProducts(updatedProducts);
      const current = updatedProducts.find((p) => p.id === quickViewProduct.id);
      if (current) setQuickViewProduct(current);
    } catch (err) {
      console.error("Submit review error:", err);
      const msg = err.response?.data?.message || err.response?.data?.detail || "Failed to submit review.";
      setReviewSuccessMsg(`⚠️ ${msg}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper map for Category Names
  const categoryMap = categories.reduce((map, c) => {
    map[c.id] = c.name;
    return map;
  }, {});

  const getCategoryNameForProduct = (product) => {
    if (product.category_name) return product.category_name;
    if (typeof product.category === 'object' && product.category?.name) return product.category.name;
    if (categoryMap[product.category]) return categoryMap[product.category];
    return 'General';
  };

  // Dynamically calculate category counts
  const categoryOptions = [
    { name: "All", count: products.length },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      count: products.filter((p) => p.category === c.id || p.category_name === c.name).length,
    })),
  ];

  // Price Bracket Filter helper
  const matchesPriceBracket = (priceNum) => {
    if (selectedPriceBracket === 'under1k') return priceNum < 1000;
    if (selectedPriceBracket === '1k-5k') return priceNum >= 1000 && priceNum <= 5000;
    if (selectedPriceBracket === '5k-25k') return priceNum >= 5000 && priceNum <= 25000;
    if (selectedPriceBracket === 'above25k') return priceNum > 25000;
    return true;
  };

  // Filtered & Sorted Products
  const filteredProducts = products
    .filter((product) => {
      const catName = getCategoryNameForProduct(product);
      const priceNum = parseFloat(product.price || 0);

      const matchesCategory =
        selectedCategory === "All" ||
        catName === selectedCategory ||
        product.category === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        catName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice = matchesPriceBracket(priceNum);

      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "price-high") return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === "rating") return (b.average_rating || 5) - (a.average_rating || 5);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.id - a.id;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-indigo-400/30">
          <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Admin Notice Banner */}
      {user?.isAdmin && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm">
          <span>🔒 Logged in as Administrator ({user.username}). Product ordering is disabled for Admin accounts.</span>
        </div>
      )}

      {/* Header & Search Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Store Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filter products by categories, live autocomplete search, price range, or customer ratings.
          </p>
        </div>

        {/* Live Autocomplete Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <SearchAutocomplete
            onSelectProduct={(p) => {
              setQuickViewProduct(p);
              setModalQty(1);
            }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="rating">Sort: Highest Customer Rating ⭐</option>
            <option value="price-low">Sort: Price Low to High</option>
            <option value="price-high">Sort: Price High to Low</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Category & Price Range Filter Pills */}
      <div className="space-y-3">
        {/* Category Pills */}
        {categoryOptions.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider pr-2">Categories:</span>
            {categoryOptions.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedCategory === cat.name
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <span>{cat.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${selectedCategory === cat.name ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Price Bracket Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider pr-2">Price Filter:</span>
          {[
            { id: 'all', label: 'All Prices' },
            { id: 'under1k', label: 'Under ₹1,000' },
            { id: '1k-5k', label: '₹1,000 - ₹5,000' },
            { id: '5k-25k', label: '₹5,000 - ₹25,000' },
            { id: 'above25k', label: 'Above ₹25,000' },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedPriceBracket(b.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedPriceBracket === b.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse h-80 flex flex-col justify-between">
              <div className="bg-slate-100 rounded-xl h-48 w-full mb-4" />
              <div className="space-y-2">
                <div className="bg-slate-100 h-4 rounded w-3/4" />
                <div className="bg-slate-100 h-3 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <p className="text-rose-600 font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && (
        <>
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <svg className="w-12 h-12 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-slate-800 font-bold text-base">No products match your selected category, price range, or search query.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedPriceBracket("all"); setSortBy("newest"); }}
                className="text-xs text-indigo-600 font-bold underline hover:text-indigo-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const catName = getCategoryNameForProduct(product);
                const avgRating = product.average_rating || 5.0;
                const countReviews = product.review_count || 0;
                const isWishlisted = wishlistIds.has(product.id);

                return (
                  <div
                    key={product.id}
                    className="group bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg flex flex-col justify-between"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Wishlist Heart Button */}
                      {!user?.isAdmin && (
                        <button
                          onClick={(e) => handleToggleWishlist(product, e)}
                          className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-slate-200/60 hover:scale-110 active:scale-90 transition-all text-xs"
                          title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                        >
                          {isWishlisted ? "❤️" : "🤍"}
                        </button>
                      )}

                      {/* Quick View Button Overlay */}
                      <button
                        onClick={() => openQuickView(product)}
                        className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-extrabold text-xs"
                      >
                        <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-xl shadow-md backdrop-blur-md">
                          👁️ Quick View & Reviews
                        </span>
                      </button>

                      {catName && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-800 font-bold text-[10px] rounded-full shadow-sm border border-slate-200/60">
                          🏷️ {catName}
                        </span>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-amber-400 text-slate-950 font-bold text-[10px] rounded-full shadow-sm">
                          Only {product.stock} left
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-rose-500 text-white font-bold text-[10px] rounded-full shadow-sm">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Rating Stars Badge */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="flex text-amber-400 text-xs">
                            {"★".repeat(Math.round(avgRating))}
                            {"☆".repeat(5 - Math.round(avgRating))}
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">
                            {avgRating} ({countReviews})
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                          {product.description || "High quality store item."}
                        </p>
                        {product.variants && product.variants.length > 1 && (
                          <div className="mt-1.5">
                            <span className="inline-block text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                              ✨ {product.variants.length} Options ({Array.from(new Set(product.variants.map((v) => v.size).filter((s) => s && s !== 'Standard'))).join(', ') || 'Variants'})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl font-extrabold text-slate-900">
                            ₹{product.price}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Stock: {product.stock ?? 'Available'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(product, 1)}
                            disabled={product.stock === 0 || user?.isAdmin}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            {user?.isAdmin ? (
                              <span>🔒 Admin (Order Disabled)</span>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* QUICK VIEW & REVIEWS MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-2xl font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              &times;
            </button>

            {/* Top Product Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center border-b border-slate-100 pb-6">
              <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 relative">
                <img
                  src={getImageUrl(quickViewProduct.image)}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
                {!user?.isAdmin && (
                  <button
                    onClick={(e) => handleToggleWishlist(quickViewProduct, e)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-slate-200/60 hover:scale-110 active:scale-90 transition-all text-xs"
                    title={wishlistIds.has(quickViewProduct.id) ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    {wishlistIds.has(quickViewProduct.id) ? "❤️" : "🤍"}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  🏷️ {getCategoryNameForProduct(quickViewProduct)}
                </span>

                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                  {quickViewProduct.name}
                </h2>

                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400 text-sm">
                    {"★".repeat(Math.round(quickViewProduct.average_rating || 5))}
                    {"☆".repeat(5 - Math.round(quickViewProduct.average_rating || 5))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {quickViewProduct.average_rating || 5.0} ({quickViewProduct.review_count || 0} reviews)
                  </span>
                </div>

                {/* Price Display */}
                <p className="text-2xl font-extrabold text-indigo-600">
                  ₹{selectedVariant ? (selectedVariant.effective_price || selectedVariant.price_override || quickViewProduct.price) : quickViewProduct.price}
                </p>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {quickViewProduct.description || "High quality product from Waniqo Store with fast shipping and warranty guarantee."}
                </p>

                {/* Product Variant Selector Pills */}
                {quickViewProduct.variants && quickViewProduct.variants.length > 1 && (
                  <div className="space-y-2 py-2 border-y border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span className="uppercase tracking-wider">Select Size / Color Option:</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Stock: {(selectedVariant ? selectedVariant.stock : quickViewProduct.stock) > 0 
                          ? `${selectedVariant ? selectedVariant.stock : quickViewProduct.stock} available` 
                          : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {quickViewProduct.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const vPrice = v.effective_price || v.price_override || quickViewProduct.price;
                        const isOutOfStock = v.stock === 0;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            disabled={isOutOfStock}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-105'
                                : isOutOfStock
                                ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                            }`}
                          >
                            <span>{v.name || `Size: ${v.size || '-'} / Color: ${v.color || '-'}`}</span>
                            {v.price_override && (
                              <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-indigo-600 font-extrabold'}`}>
                                ₹{vPrice}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-3">
                  {!user?.isAdmin && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="px-3 py-1 text-slate-600 hover:bg-slate-200 font-bold rounded-l-xl text-sm"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-xs font-extrabold text-slate-900">{modalQty}</span>
                        <button
                          onClick={() => setModalQty(modalQty + 1)}
                          className="px-3 py-1 text-slate-600 hover:bg-slate-200 font-bold rounded-r-xl text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAddToCart(quickViewProduct, modalQty, selectedVariant)}
                    disabled={(selectedVariant ? selectedVariant.stock : quickViewProduct.stock) === 0 || user?.isAdmin}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                  >
                    {user?.isAdmin ? (
                      <span>🔒 Admin Mode (Order Disabled)</span>
                    ) : (selectedVariant ? selectedVariant.stock : quickViewProduct.stock) === 0 ? (
                      <span>Out of Stock</span>
                    ) : (
                      <span>Add {modalQty} to Cart &bull; ₹{(parseFloat(selectedVariant ? (selectedVariant.effective_price || selectedVariant.price_override || quickViewProduct.price) : quickViewProduct.price) * modalQty).toFixed(2)}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CUSTOMER REVIEWS & RATINGS SECTION */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Customer Reviews & Ratings ⭐ ({quickViewProduct.reviews?.length || 0})
                </h3>
              </div>

              {/* Review Success / Error Alert */}
              {reviewSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold p-3.5 rounded-xl text-center">
                  {reviewSuccessMsg}
                </div>
              )}

              {/* Submit A Review Form (For Customers) */}
              {isAuthenticated && !user?.isAdmin && (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Leave Your Review & Rating</h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Select Star Rating:</span>
                    <div className="flex text-amber-400 text-xl cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="hover:scale-125 transition-transform"
                        >
                          {star <= newRating ? "★" : "☆"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows="2"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your honest feedback about this product..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    {submittingReview ? "Submitting..." : "Post Customer Review"}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {quickViewProduct.reviews && quickViewProduct.reviews.length > 0 ? (
                  quickViewProduct.reviews.map((rev) => (
                    <div key={rev.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">👤 {rev.username || 'Customer'}</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full border border-emerald-200">
                            Verified Buyer
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      <div className="flex text-amber-400 text-xs">
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No customer reviews yet. Be the first to leave a review!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;