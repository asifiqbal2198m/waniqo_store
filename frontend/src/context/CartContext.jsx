import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend if authenticated customer, or localStorage if guest
  const fetchCart = async () => {
    if (user?.isAdmin) {
      setCartItems([]);
      return;
    }

    if (isAuthenticated) {
      setLoading(true);
      try {
        const response = await api.get('cart/');
        if (response.data?.cart?.items) {
          setCartItems(response.data.cart.items);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Failed to fetch cart from server:', err);
      } finally {
        setLoading(false);
      }
    } else {
      const saved = localStorage.getItem('local_cart');
      setCartItems(saved ? JSON.parse(saved) : []);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, user]);

  // Save guest cart to localStorage
  useEffect(() => {
    if (!isAuthenticated && !user?.isAdmin) {
      localStorage.setItem('local_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated, user]);

  const addToCart = async (product, quantity = 1, variant = null) => {
    if (user?.isAdmin) {
      return {
        success: false,
        message: '🔒 Admin Accounts are restricted from purchasing items or creating shopping carts.',
      };
    }

    const variantId = variant?.id || null;

    if (isAuthenticated) {
      try {
        await api.post('cart/add/', { product_id: product.id, variant_id: variantId, quantity });
        await fetchCart();
        return { success: true, message: `Added ${product.name}${variant ? ` (${variant.name})` : ''} to cart!` };
      } catch (err) {
        const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to add item to server cart.';
        return { success: false, message: msg };
      }
    } else {
      setCartItems((prev) => {
        const existing = prev.find((item) => {
          const matchProd = (item.product?.id === product.id || item.product_id === product.id);
          const matchVar = variantId ? (item.variant?.id === variantId || item.variant_id === variantId) : !item.variant;
          return matchProd && matchVar;
        });

        if (existing) {
          return prev.map((item) => {
            const matchProd = (item.product?.id === product.id || item.product_id === product.id);
            const matchVar = variantId ? (item.variant?.id === variantId || item.variant_id === variantId) : !item.variant;
            return matchProd && matchVar
              ? { ...item, quantity: item.quantity + quantity }
              : item;
          });
        }
        return [
          ...prev,
          {
            id: Date.now(),
            product: product,
            product_name: product.name,
            variant: variant,
            variant_details: variant,
            price: variant?.effective_price || variant?.price_override || product.price,
            quantity: quantity
          }
        ];
      });
      return { success: true, message: `Added ${product.name}${variant ? ` (${variant.name})` : ''} to cart!` };
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (user?.isAdmin) return;

    if (newQuantity <= 0) {
      return removeFromCart(itemId);
    }

    if (isAuthenticated) {
      try {
        await api.put(`cart/items/${itemId}/`, { quantity: newQuantity });
        await fetchCart();
      } catch (err) {
        console.error('Failed to update cart item:', err);
      }
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
      );
    }
  };

  const removeFromCart = async (itemId) => {
    if (user?.isAdmin) return;

    if (isAuthenticated) {
      try {
        await api.delete(`cart/items/${itemId}/delete/`);
        await fetchCart();
      } catch (err) {
        console.error('Failed to delete cart item:', err);
      }
    } else {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (!isAuthenticated) {
      localStorage.removeItem('local_cart');
    }
  };

  const totalCount = user?.isAdmin ? 0 : cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = user?.isAdmin
    ? 0
    : cartItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price || item.product?.price || 0);
        return sum + itemPrice * item.quantity;
      }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems: user?.isAdmin ? [] : cartItems,
        totalCount,
        totalPrice,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
