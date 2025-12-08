import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  Package, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Pagos Pendientes",
    value: "12",
    description: "Requieren verificación",
    icon: Clock,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    link: "/admin/conciliacion?status=pending"
  },
  {
    title: "Pagos Verificados",
    value: "156",
    description: "Este mes",
    icon: CheckCircle2,
    color: "text-teal",
    bgColor: "bg-teal/10",
    link: "/admin/conciliacion?status=verified"
  },
  {
    title: "Vendedores Activos",
    value: "89",
    description: "+5 esta semana",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
    link: "/admin/vendedores"
  },
  {
    title: "Volumen B2B",
    value: "$45.2K",
    description: "+12% vs mes anterior",
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
    link: "/admin/conciliacion"
  },
];

const recentPayments = [
  { id: "PAY-001", seller: "Jean Pierre", amount: "$2,450", method: "Mon Cash", status: "pending", date: "Hace 2h" },
  { id: "PAY-002", seller: "Marie Claire", amount: "$1,890", method: "Stripe", status: "verified", date: "Hace 4h" },
  { id: "PAY-003", seller: "Paul Baptiste", amount: "$3,200", method: "Transferencia", status: "pending", date: "Hace 5h" },
  { id: "PAY-004", seller: "Sophie Louis", amount: "$890", method: "Mon Cash", status: "rejected", date: "Hace 6h" },
];

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

const AdminDashboard = () => {
  return (
    <AdminLayout 
      title="Dashboard" 
      subtitle="Bienvenido al panel de administración"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
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
                    <td className="py-3 px-4 text-sm font-mono text-foreground">{payment.id}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{payment.seller}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-foreground">{payment.amount}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{payment.method}</td>
                    <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
