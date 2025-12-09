import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  CreditCard,
  Smartphone,
  Building2,
  AlertTriangle,
  Download,
  Loader2
} from "lucide-react";
import { usePayments, Payment } from "@/hooks/usePayments";
import { Skeleton } from "@/components/ui/skeleton";

const getMethodIcon = (method: Payment["method"]) => {
  switch (method) {
    case "stripe":
      return <CreditCard className="w-4 h-4" />;
    case "moncash":
      return <Smartphone className="w-4 h-4" />;
    case "transfer":
      return <Building2 className="w-4 h-4" />;
  }
};

const getMethodLabel = (method: Payment["method"]) => {
  switch (method) {
    case "stripe": return "Stripe";
    case "moncash": return "Mon Cash";
    case "transfer": return "Transferencia Bancaria";
  }
};

const getStatusBadge = (status: Payment["status"]) => {
  switch (status) {
    case "verified":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal/10 text-teal"><CheckCircle2 className="w-3 h-3" />Verificado</span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600"><Clock className="w-3 h-3" />Pendiente</span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" />Rechazado</span>;
  }
};

const AdminConciliacion = () => {
  const { payments, stats, isLoading, updatePaymentStatus } = usePayments();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"verify" | "reject" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const handleAction = (payment: Payment, action: "verify" | "reject") => {
    setSelectedPayment(payment);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const confirmActionHandler = async () => {
    if (!selectedPayment || !confirmAction) return;

    setIsUpdating(true);
    const success = await updatePaymentStatus(
      selectedPayment.id, 
      confirmAction === "verify" ? "verified" : "rejected"
    );

    if (success) {
      setIsConfirmOpen(false);
      setSelectedPayment(null);
      setConfirmAction(null);
    }
    setIsUpdating(false);
  };

  const openDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Conciliación B2B" subtitle="Verificación de pagos anticipados">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-16 mb-6" />
        <Skeleton className="h-96" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Conciliación B2B" 
      subtitle="Verificación de pagos anticipados"
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-teal/5 border-teal/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal/10">
              <CheckCircle2 className="w-6 h-6 text-teal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">Verificados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rechazados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, vendedor o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="moncash">Mon Cash</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pagos B2B</CardTitle>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Referencia</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 text-sm font-mono text-foreground">{payment.payment_number}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{payment.seller?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{payment.seller?.email || ''}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-foreground">
                      ${payment.amount.toLocaleString()} {payment.currency}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getMethodIcon(payment.method)}
                        <span>{getMethodLabel(payment.method)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-muted-foreground">
                      {payment.reference}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(payment.status)}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString("es-HT", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDetail(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-teal hover:text-teal hover:bg-teal/10"
                              onClick={() => handleAction(payment, "verify")}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleAction(payment, "reject")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No se encontraron pagos</p>
                <p className="text-sm text-muted-foreground">
                  {payments.length === 0 
                    ? "Aún no hay pagos B2B registrados en el sistema" 
                    : "Intenta ajustar los filtros de búsqueda"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Pago {selectedPayment?.payment_number}</DialogTitle>
            <DialogDescription>
              Información completa de la transacción B2B
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{selectedPayment.seller?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedPayment.seller?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedPayment.seller?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto</p>
                  <p className="font-bold text-lg">${selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(selectedPayment.method)}
                    <span className="font-medium">{getMethodLabel(selectedPayment.method)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Referencia de Pago</p>
                <p className="font-mono bg-muted p-2 rounded text-sm">{selectedPayment.reference}</p>
              </div>

              {selectedPayment.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Cerrar
            </Button>
            {selectedPayment?.status === "pending" && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleAction(selectedPayment, "reject");
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button 
                  className="bg-teal hover:bg-teal/90"
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleAction(selectedPayment, "verify");
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verificar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "verify" ? "Verificar Pago" : "Rechazar Pago"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "verify" 
                ? "¿Estás seguro de que deseas verificar este pago? Esta acción confirmará que el pago ha sido recibido correctamente."
                : "¿Estás seguro de que deseas rechazar este pago? El vendedor será notificado del rechazo."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedPayment.payment_number}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.seller?.name}</p>
                </div>
                <p className="font-bold text-lg">${selectedPayment.amount.toLocaleString()}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              variant={confirmAction === "verify" ? "default" : "destructive"}
              className={confirmAction === "verify" ? "bg-teal hover:bg-teal/90" : ""}
              onClick={confirmActionHandler}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmAction === "verify" ? "Confirmar Verificación" : "Confirmar Rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminConciliacion;
