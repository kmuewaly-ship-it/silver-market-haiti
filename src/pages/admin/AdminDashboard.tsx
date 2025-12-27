import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Package,
  PackageCheck,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePayments, useSellers, Payment } from "@/hooks/usePayments";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal"><CheckCircle2 className="w-3 h-3" />Verificado</span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500"><Clock className="w-3 h-3" />Pendiente</span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><AlertTriangle className="w-3 h-3" />Rechazado</span>;
    default:
      return null;
  }
};

const getMethodLabel = (method: string) => {
  switch (method) {
    case "stripe": return "Stripe";
    case "moncash": return "Mon Cash";
    case "transfer": return "Transferencia";
    default: return method;
  }
};

const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
  <div className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-border/50">
    <div className="flex items-start justify-between mb-3">
      <div className={`${bgColor} p-2 rounded-lg`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-lg font-semibold text-foreground">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const { payments, stats, isLoading: paymentsLoading } = usePayments();
  const { sellersCount, isLoading: sellersLoading } = useSellers();

  const isLoading = paymentsLoading || sellersLoading;
  const recentPayments = payments.slice(0, 5);

  const stickyStatsData = [
    {
      label: "Total Órdenes",
      value: "2,847",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Ingresos",
      value: "$48,392",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Comisiones",
      value: "$4,839",
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      label: "Vendedores",
      value: sellersCount.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "KYC Pendiente",
      value: "12",
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      label: "Aprobaciones",
      value: "8",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  const dashStatsData = [
    {
      title: "Pagos Pendientes",
      value: stats.pending.toString(),
      description: "Requieren verificación",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      link: "/admin/conciliacion?status=pending"
    },
    {
      title: "Pagos Verificados",
      value: stats.verified.toString(),
      description: "Este mes",
      icon: CheckCircle2,
      color: "text-teal",
      bgColor: "bg-teal/10",
      link: "/admin/conciliacion?status=verified"
    },
    {
      title: "Vendedores Activos",
      value: sellersCount.toString(),
      description: "Registrados",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/admin/vendedores"
    },
    {
      title: "Volumen B2B",
      value: `$${(stats.totalVolume / 1000).toFixed(1)}K`,
      description: "Total verificado",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
      link: "/admin/conciliacion"
    },
    {
      title: "Comisiones Personalizadas",
      value: "Gestionar",
      description: "Overrides por vendedor",
      icon: Percent,
      color: "text-purple-600",
      bgColor: "bg-purple-600/10",
      link: "/admin/commissions"
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Bienvenido al panel de administración">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 -mx-6 px-6 py-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Dashboard" 
      subtitle="Bienvenido al panel de administración"
    >
      {/* Sticky Stats Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 -mx-6 px-6 py-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stickyStatsData.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              bgColor={stat.bgColor}
            />
          ))}
        </div>
      </div>

      {/* Dashboard Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {dashStatsData.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-card transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pagos Recientes B2B</CardTitle>
            <p className="text-sm text-muted-foreground">Últimas transacciones para verificar</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/conciliacion">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {recentPayments.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendedor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Monto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Método</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-mono text-foreground">{payment.payment_number}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{payment.seller?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-foreground">${payment.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{getMethodLabel(payment.method)}</td>
                      <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString("es-HT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">Sin pagos recientes</p>
                <p className="text-sm text-muted-foreground">Los pagos B2B aparecerán aquí cuando se registren</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
