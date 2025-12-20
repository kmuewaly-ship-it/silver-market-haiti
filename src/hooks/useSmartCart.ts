/**
 * Smart Cart Hook
 * Automatically routes cart operations based on user role:
 * - Sellers/Admins -> B2B Cart with MOQ
 * - Regular users -> B2C Cart
 */

import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useCartB2B } from "@/hooks/useCartB2B";
import { UserRole } from "@/types/auth";
import { toast } from "sonner";

interface ProductForCart {
  id: string;
  name: string;
  price: number; // B2C price
  priceB2B?: number; // B2B/wholesale price
  pvp?: number; // Precio venta sugerido
  moq?: number; // Minimum order quantity
  stock?: number;
  image: string;
  sku: string;
  storeId?: string;
  storeName?: string;
  storeWhatsapp?: string;
}

interface BusinessSummary {
  investment: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  profitPerUnit: number;
  profitPercentage: number;
}

export const useSmartCart = () => {
  const { role } = useAuth();
  const b2cCart = useCart();
  const b2bCart = useCartB2B();

  const isB2BUser = role === UserRole.SELLER || role === UserRole.ADMIN;

  const addToCart = (product: ProductForCart) => {
    if (isB2BUser) {
      // Add to B2B cart with MOQ
      const moq = product.moq || 1;
      const priceB2B = product.priceB2B || product.price;
      const stock = product.stock || moq;

      if (stock < moq) {
        toast.error(`Stock insuficiente. Disponible: ${stock}, MOQ: ${moq}`);
        return false;
      }

      b2bCart.addItem({
        productId: product.id,
        sku: product.sku,
        nombre: product.name,
        precio_b2b: priceB2B,
        moq: moq,
        stock_fisico: stock,
        cantidad: moq, // Start with MOQ
        subtotal: priceB2B * moq,
        imagen_principal: product.image,
      });

      toast.success(`Agregado al carrito B2B`, {
        description: `${product.name} x ${moq} unidades (MOQ)`,
      });
      return true;
    } else {
      // Add to B2C cart
      b2cCart.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        sku: product.sku,
        storeId: product.storeId,
        storeName: product.storeName,
        storeWhatsapp: product.storeWhatsapp,
      });

      toast.success("Añadido al carrito", {
        description: product.name,
      });
      return true;
    }
  };

  const getCartInfo = () => {
    if (isB2BUser) {
      return {
        totalItems: b2bCart.cart.totalItems,
        totalQuantity: b2bCart.cart.totalQuantity,
        subtotal: b2bCart.cart.subtotal,
        items: b2bCart.cart.items,
        cartType: "b2b" as const,
        cartLink: "/seller/carrito",
      };
    } else {
      return {
        totalItems: b2cCart.totalItems(),
        totalQuantity: b2cCart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: b2cCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        items: b2cCart.items,
        cartType: "b2c" as const,
        cartLink: "/carrito",
      };
    }
  };

  /**
   * Calculate business summary for B2B purchases
   */
  const getBusinessSummary = (
    costB2B: number,
    pvp: number,
    quantity: number
  ): BusinessSummary => {
    const profitPerUnit = pvp - costB2B;
    const profitPercentage = costB2B > 0 ? Math.round((profitPerUnit / costB2B) * 100) : 0;

    return {
      investment: quantity * costB2B,
      estimatedRevenue: quantity * pvp,
      estimatedProfit: quantity * profitPerUnit,
      profitPerUnit,
      profitPercentage,
    };
  };

  return {
    addToCart,
    getCartInfo,
    getBusinessSummary,
    isB2BUser,
    // Expose underlying carts for direct access when needed
    b2cCart,
    b2bCart,
  };
};