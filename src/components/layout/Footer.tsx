import { Link } from "react-router-dom";
import { ShoppingBag, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    platform: [
      { label: "Catálogo", href: "/catalogo" },
      { label: "Puntos de Recogida", href: "/puntos" },
      { label: "Cómo Funciona", href: "/#como-funciona" },
      { label: "Precios", href: "/precios" },
    ],
    sellers: [
      { label: "Portal Vendedor", href: "/seller/login" },
      { label: "Registro", href: "/seller/registro" },
      { label: "Manual de Cumplimiento", href: "/manual" },
      { label: "Soporte", href: "/soporte" },
    ],
    legal: [
      { label: "Términos y Condiciones", href: "/terminos" },
      { label: "Política de Privacidad", href: "/privacidad" },
      { label: "Política de Reembolsos", href: "/reembolsos" },
    ],
  };

  return (
    <footer className="bg-navy text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <span className="font-bold text-xl block">Siver Market</span>
                <span className="text-accent text-sm font-semibold">509</span>
              </div>
            </Link>
            <p className="text-primary-foreground/70 mb-6">
              La plataforma mayorista B2B y marketplace B2C líder en Haití. 
              Conectando negocios con oportunidades.
            </p>
            <div className="space-y-3">
              <a href="mailto:contact@sivermarket509.com" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Mail className="w-5 h-5" />
                contact@sivermarket509.com
              </a>
              <a href="tel:+50936000000" className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors">
                <Phone className="w-5 h-5" />
                +509 3600 0000
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin className="w-5 h-5 flex-shrink-0" />
                Port-au-Prince, Haití
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Plataforma</h4>
            <ul className="space-y-3">
              {links.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sellers Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Vendedores</h4>
            <ul className="space-y-3">
              {links.sellers.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {currentYear} Siver Market 509. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-primary-foreground/50 text-sm">
              Powered by
            </span>
            <span className="font-semibold text-accent">Siver Market</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
