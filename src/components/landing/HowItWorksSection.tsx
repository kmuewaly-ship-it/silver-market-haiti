import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Regístrate como Vendedor",
    description: "Completa el proceso KYC con tu documentación y cuenta Mon Cash.",
    features: ["Verificación de identidad", "Documentos de negocio", "Cuenta Mon Cash"],
  },
  {
    number: "02",
    title: "Adquiere Lotes B2B",
    description: "Explora el catálogo y compra lotes al por mayor con pago anticipado.",
    features: ["MOQ flexible", "Precios mayoristas", "Pago seguro"],
  },
  {
    number: "03",
    title: "Personaliza y Vende",
    description: "Edita precios y descripciones de tus productos para la venta B2C.",
    features: ["Editor intuitivo", "Fotos personalizadas", "Tu margen de ganancia"],
  },
  {
    number: "04",
    title: "Entrega en Punto de Recogida",
    description: "El cliente recoge en el punto más cercano. Tú generas la guía.",
    features: ["+50 puntos en Haití", "Guía automática", "Seguimiento en tiempo real"],
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-teal/10 text-teal text-sm font-semibold mb-4">
            Proceso Simple
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            ¿Cómo funciona{" "}
            <span className="text-teal">Siver Market 509</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            En 4 simples pasos puedes empezar a vender productos 
            de calidad en toda Haití.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative p-8 rounded-3xl bg-card border border-border hover:border-teal/30 transition-all duration-300 group animate-fade-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-8 px-4 py-1 rounded-full bg-teal text-primary-foreground font-bold text-sm">
                Paso {step.number}
              </div>
              
              <div className="pt-4">
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {step.description}
                </p>
                
                {/* Features List */}
                <ul className="space-y-3">
                  {step.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
