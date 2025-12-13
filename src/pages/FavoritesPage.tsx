import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const FavoritesPage = () => {
  // TODO: Implementar lógica real de favoritos
  const favoriteItems = []; // Mock empty favorites

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500 fill-current" />
          Mis Favoritos
        </h1>

        {favoriteItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-4">
                <Heart className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No tienes favoritos aún</h2>
              <p className="text-muted-foreground mb-6">
                Guarda los productos que te gustan para verlos más tarde.
              </p>
              <Button asChild>
                <Link to="/">Explorar productos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Grid de productos favoritos */}
            {/* ... */}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
