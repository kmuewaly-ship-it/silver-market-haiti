import { ArrowRight, Package, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal/20 rounded-full blur-3xl" />
      
      <div className="container relative z-10 mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground">
              Marketplace Mayorista #1 en Haití
            </span>
          </div>
          
          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Comercio al Por Mayor{" "}
            <span className="text-gradient-gold">Sin Fronteras</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Conectamos mayoristas con vendedores en toda Haití. 
            Sistema de pago anticipado B2B y red de puntos de recogida 
            para entregas seguras.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/catalogo" className="flex items-center gap-2">
                Explorar Catálogo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/seller/registro">
                Convertirse en Vendedor
              </Link>
            </Button>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-bold text-primary-foreground">Lotes Flexibles</p>
                <p className="text-sm text-primary-foreground/70">MOQ adaptado a ti</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-teal/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-light" />
              </div>
              <div className="text-left">
                <p className="font-bold text-primary-foreground">Pago Seguro</p>
                <p className="text-sm text-primary-foreground/70">Conciliación B2B</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-primary-foreground">+50 Puntos</p>
                <p className="text-sm text-primary-foreground/70">Recogida en todo Haití</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave SVG */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
