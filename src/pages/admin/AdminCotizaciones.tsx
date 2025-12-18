import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminQuotes, PendingQuote } from '@/hooks/useQuotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Eye, CheckCircle, XCircle, Clock, RefreshCw, FileText } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  responded: { label: 'Respondida', variant: 'default', icon: <MessageSquare className="h-3 w-3" /> },
  approved: { label: 'Aprobada', variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: 'Rechazada', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
};

export default function AdminCotizaciones() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { quotes, isLoading, refetch, updateQuoteStatus } = useAdminQuotes(statusFilter);
  const [selectedQuote, setSelectedQuote] = useState<PendingQuote | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleViewDetails = (quote: PendingQuote) => {
    setSelectedQuote(quote);
    setAdminNotes(quote.admin_notes || '');
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedQuote) return;
    await updateQuoteStatus(selectedQuote.id, status, adminNotes);
    setDetailsOpen(false);
  };

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    responded: quotes.filter(q => q.status === 'responded').length,
    approved: quotes.filter(q => q.status === 'approved').length,
  };

  return (
    <AdminLayout title="Cotizaciones" subtitle="Gestiona las solicitudes de cotización de sellers">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.responded}</p>
                <p className="text-xs text-muted-foreground">Respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Aprobadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="responded">Respondidas</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cotizaciones {statusFilter !== 'all' ? 'con este estado' : ''}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Cotización</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">{quote.quote_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quote.seller_profile?.full_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{quote.seller_profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${quote.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{quote.total_quantity}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[quote.status]?.variant || 'secondary'} className="gap-1">
                        {statusConfig[quote.status]?.icon}
                        {statusConfig[quote.status]?.label || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(quote.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(quote)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cotización {selectedQuote?.quote_number}</DialogTitle>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Seller</p>
                  <p className="font-medium">{selectedQuote.seller_profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedQuote.seller_profile?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Badge variant={statusConfig[selectedQuote.status]?.variant || 'secondary'} className="gap-1">
                    {statusConfig[selectedQuote.status]?.icon}
                    {statusConfig[selectedQuote.status]?.label || selectedQuote.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(selectedQuote.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">WhatsApp enviado</p>
                  <p className="font-medium">
                    {selectedQuote.whatsapp_sent_at 
                      ? format(new Date(selectedQuote.whatsapp_sent_at), 'dd MMM yyyy HH:mm', { locale: es })
                      : 'No'}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div>
                <p className="text-sm font-medium mb-2">Productos</p>
                <div className="border rounded-lg divide-y">
                  {selectedQuote.cart_snapshot?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.subtotal?.toFixed(2) || item.total_price?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{item.cantidad || item.quantity} uds × ${item.precio_b2b?.toFixed(2) || item.unit_price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 p-2 bg-muted rounded-lg">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">${selectedQuote.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Seller Notes */}
              {selectedQuote.seller_notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notas del Seller</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{selectedQuote.seller_notes}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <p className="text-sm font-medium mb-1">Notas del Admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agregar notas sobre esta cotización..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cerrar
            </Button>
            <Button variant="secondary" onClick={() => handleStatusUpdate('responded')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Marcar Respondida
            </Button>
            <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')}>
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
            <Button onClick={() => handleStatusUpdate('approved')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
