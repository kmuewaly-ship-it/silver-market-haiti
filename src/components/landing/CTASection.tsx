import { ArrowRight, Store, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-teal" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
            
            {/* Content */}
            <div className="relative z-10 p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                ¿Listo para crecer tu negocio en{" "}
                <span className="text-gradient-gold">Haití</span>?
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">
                Únete a la red de vendedores más grande del país. 
                Acceso a productos mayoristas, sistema de pagos seguro 
                y logística simplificada.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/seller/registro" className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Registrarme como Vendedor
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="heroOutline" size="xl" asChild>
                  <Link to="/admin/login" className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Acceso Administrador
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
