const stats = [
  { value: "500+", label: "Vendedores Activos" },
  { value: "10K+", label: "Productos Disponibles" },
  { value: "50+", label: "Puntos de Recogida" },
  { value: "99%", label: "Entregas Exitosas" },
];

const StatsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-hero-gradient">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-2">
                {stat.value}
              </p>
              <p className="text-primary-foreground/70 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
