import { z } from "zod";

// Schemas de validación

export const ProductFormSchema = z.object({
  name: z.string().min(5, "El nombre debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  price: z.number().min(0.01, "El precio debe ser mayor a 0"),
  category: z.string().min(1, "Selecciona una categoría"),
  image: z.string().url("URL de imagen inválida"),
  stock: z.number().min(0, "El stock no puede ser negativo").int(),
  discount: z.number().min(0).max(100).optional(),
  sku: z.string().min(1, "SKU requerido"),
});

export const SellerRegistrationSchema = z.object({
  storeName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  phone: z.string().min(7, "Teléfono inválido"),
  businessType: z.enum(["individual", "company"], { errorMap: () => ({ message: "Selecciona un tipo de negocio" }) }),
  taxId: z.string().min(1, "Documento fiscal requerido"),
  address: z.string().min(10, "Dirección completa requerida"),
  bankAccount: z.string().min(10, "Cuenta bancaria inválida"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

export const SearchFilterSchema = z.object({
  query: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  category: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc", "rating"]).optional(),
});

export const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1, "Cantidad mínima es 1"),
  color: z.string().optional(),
  size: z.string().optional(),
});

export const CheckoutSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(2, "Nombre requerido"),
  lastName: z.string().min(2, "Apellido requerido"),
  address: z.string().min(10, "Dirección completa requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  zipCode: z.string().min(3, "Código postal inválido"),
  country: z.string().min(2, "País requerido"),
  cardName: z.string().min(3, "Nombre en tarjeta requerido"),
  cardNumber: z.string().regex(/^\d{16}$/, "Número de tarjeta inválido"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Fecha de vencimiento inválida (MM/YY)"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
});

// Tipos exportados desde schemas
export type ProductForm = z.infer<typeof ProductFormSchema>;
export type SellerRegistration = z.infer<typeof SellerRegistrationSchema>;
export type SearchFilter = z.infer<typeof SearchFilterSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Checkout = z.infer<typeof CheckoutSchema>;
