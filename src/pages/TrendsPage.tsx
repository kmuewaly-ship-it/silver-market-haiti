import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, X } from "lucide-react";
import { usePublicCategories } from "@/hooks/useCategories";
import { useTrendingProducts } from "@/hooks/useTrendingProducts";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import FeaturedCarousel from "@/components/shared/FeaturedCarousel";
import TrendingStoresSection from "@/components/trends/TrendingStoresSection";
import TrendingCategoriesSection from "@/components/trends/TrendingCategoriesSection";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
const TrendsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    role,
    user
  } = useAuth();
  const {
    data: categories,
    isLoading: categoriesLoading
  } = usePublicCategories();
  const {
    data: trendingProducts,
    isLoading: trendingLoading
  } = useTrendingProducts(7, 20);
  const isB2B = user && (role === UserRole.SELLER || role === UserRole.ADMIN);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>("trending");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate max price from trending products
  const maxPrice = useMemo(() => {
    if (!trendingProducts) return 1000;
    return Math.max(...trendingProducts.map(p => p.precio_sugerido_venta || p.precio_mayorista || 0), 1000);
  }, [trendingProducts]);

  // Get filtered and sorted trending products
  const filteredTrendingProducts = useMemo(() => {
    let products = trendingProducts || [];

    // Filter by category
    if (selectedCategory !== "all") {
      products = products.filter(p => p.categoria_id === selectedCategory);
    }

    // Filter by price range
    products = products.filter(p => {
      const price = p.precio_sugerido_venta || p.precio_mayorista;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    if (sortBy === "price-low") {
      products = [...products].sort((a, b) => (a.precio_sugerido_venta || a.precio_mayorista) - (b.precio_sugerido_venta || b.precio_mayorista));
    } else if (sortBy === "price-high") {
      products = [...products].sort((a, b) => (b.precio_sugerido_venta || b.precio_mayorista) - (a.precio_sugerido_venta || a.precio_mayorista));
    }
    return products;
  }, [trendingProducts, selectedCategory, priceRange, sortBy]);
  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, maxPrice]);
    setSortBy("trending");
  };
  const hasActiveFilters = selectedCategory !== "all" || priceRange[0] > 0 || priceRange[1] < maxPrice;
  const FilterControls = () => <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories?.filter(c => !c.parent_id).map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rango de Precio: ${priceRange[0]} - ${priceRange[1]}
        </label>
        <Slider value={priceRange} onValueChange={value => setPriceRange(value as [number, number])} min={0} max={maxPrice} step={10} className="mt-2" />
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trending">Más populares</SelectItem>
            <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
            <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Limpiar Filtros
        </Button>}
    </div>;

  // Featured products for carousel
  const featuredProducts = useMemo(() => {
    return (trendingProducts || []).slice(0, 8).map(p => ({
      id: p.id,
      sku: p.sku_interno,
      nombre: p.nombre,
      precio: p.precio_sugerido_venta || p.precio_mayorista,
      imagen_principal: p.imagen_principal || '/placeholder.svg',
      stock: p.stock_status === 'out_of_stock' ? 0 : 1,
      moq: 1
    }));
  }, [trendingProducts]);
  return <div className="min-h-screen bg-gray-50">
      {!isMobile && <Header />}

      {/* Featured Carousel - Mobile Only */}
      {isMobile && featuredProducts.length > 0 && <div className="pt-2">
          <FeaturedCarousel products={featuredProducts} showMoq={isB2B} />
        </div>}
      
      {/* Hero Section */}
      

      <div className={`container mx-auto px-4 py-12 ${isMobile ? 'pb-20' : ''}`}>
        {/* Filters Bar */}
        

        <div className="space-y-16">
          {/* Trending Stores Section */}
          <TrendingStoresSection />

          {/* Trending Categories Section */}
          <TrendingCategoriesSection />
        </div>
      </div>
      {!isMobile && <Footer />}
    </div>;
};
export default TrendsPage;