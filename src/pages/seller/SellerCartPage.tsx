import { SellerLayout } from "@/components/seller/SellerLayout";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const SellerCartPage = () => {
  // TODO: Implementar lógica real del carrito B2B (Lotes)
  const cartItems = []; // Mock empty cart

  return (
    <SellerLayout>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Carrito de Compras B2B
          </h1>

          {cartItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex justify-center mb-4">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Tu carrito de lotes está vacío</h2>
                <p className="text-muted-foreground mb-6">
                  Visita el catálogo de adquisición de lotes para abastecer tu inventario.
                </p>
                <Button asChild>
                  <Link to="/seller/adquisicion-lotes">Ir al Catálogo de Lotes</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {/* Lista de lotes en el carrito */}
              </div>
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Compra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>$0.00</span>
                      </div>
                    </div>
                    <Button className="w-full">Proceder al Pago</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </SellerLayout>
  );
};

export default SellerCartPage;
