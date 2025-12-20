import { useState, useCallback } from 'react';
import { CartB2B, CartItemB2B } from '@/types/b2b';

const CART_STORAGE_KEY = 'siver_b2b_cart';

export const useCartB2B = () => {
  const [cart, setCart] = useState<CartB2B>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : { items: [], totalItems: 0, totalQuantity: 0, subtotal: 0 };
    } catch {
      return { items: [], totalItems: 0, totalQuantity: 0, subtotal: 0 };
    }
  });

  const calculateTotals = useCallback((items: CartItemB2B[]): { totalItems: number; totalQuantity: number; subtotal: number } => {
    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.cantidad, 0),
      subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
  }, []);

  const saveCart = useCallback((items: CartItemB2B[]) => {
    const totals = calculateTotals(items);
    const newCart = { items, ...totals };
    setCart(newCart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
  }, [calculateTotals]);

  const addItem = useCallback((item: CartItemB2B) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find((i) => i.productId === item.productId);

      if (existingItem) {
        // Actualizar cantidad si ya existe
        const updatedItems = prevCart.items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                cantidad: i.cantidad + item.cantidad,
                subtotal: (i.cantidad + item.cantidad) * i.precio_b2b,
              }
            : i
        );
        saveCart(updatedItems);
        return { ...prevCart, items: updatedItems };
      } else {
        // Agregar nuevo producto
        const updatedItems = [...prevCart.items, item];
        saveCart(updatedItems);
        return { ...prevCart, items: updatedItems };
      }
    });
  }, [saveCart]);

  const updateQuantity = useCallback((productId: string, cantidad: number) => {
    setCart((prevCart) => {
      const item = prevCart.items.find((i) => i.productId === productId);
      if (!item) return prevCart;
      
      // Validar que no baje del MOQ
      const validCantidad = Math.max(cantidad, item.moq);
      
      const updatedItems = prevCart.items.map((i) =>
        i.productId === productId
          ? {
              ...i,
              cantidad: validCantidad,
              subtotal: validCantidad * i.precio_b2b,
            }
          : i
      );
      saveCart(updatedItems);
      return { ...prevCart, items: updatedItems };
    });
  }, [saveCart]);

  const removeItem = useCallback((productId: string) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.items.filter((item) => item.productId !== productId);
      saveCart(updatedItems);
      return { ...prevCart, items: updatedItems };
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setCart({ items: [], totalItems: 0, totalQuantity: 0, subtotal: 0 });
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const validateItem = (item: CartItemB2B): { valid: boolean; error?: string } => {
    if (item.cantidad < item.moq) {
      return {
        valid: false,
        error: `La cantidad mínima de pedido (MOQ) es ${item.moq} unidades`,
      };
    }
    if (item.cantidad > item.stock_fisico) {
      return {
        valid: false,
        error: `Stock disponible: ${item.stock_fisico} unidades`,
      };
    }
    return { valid: true };
  };

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    validateItem,
  };
};
