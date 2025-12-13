import { SellerLayout } from "@/components/seller/SellerLayout";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const SellerFavoritesPage = () => {
  // TODO: Implementar lógica real de favoritos B2B (Lista de deseos de lotes)
  const favoriteItems = []; // Mock empty favorites

  return (
    <SellerLayout>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Lista de Deseos (Lotes)
          </h1>

          {favoriteItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex justify-center mb-4">
                  <Heart className="h-16 w-16 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No tienes lotes guardados</h2>
                <p className="text-muted-foreground mb-6">
                  Guarda los lotes que te interesan para revisarlos más tarde.
                </p>
                <Button asChild>
                  <Link to="/seller/adquisicion-lotes">Explorar Lotes</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Grid de lotes favoritos */}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </SellerLayout>
  );
};

export default SellerFavoritesPage;
