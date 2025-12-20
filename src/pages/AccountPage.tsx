import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, Mail, Calendar, Package, MapPin, LogOut, Settings, Shield, CreditCard, Bell, Edit, Store, Loader2, CheckCircle, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { UserRole } from "@/types/auth";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddressesDialog } from "@/components/account/AddressesDialog";
import { SettingsDialog } from "@/components/account/SettingsDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const AccountPage = () => {
  const { user, signOut, role } = useAuth();
  const isMobile = useIsMobile();
  const [showAddresses, setShowAddresses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRequestingUpgrade, setIsRequestingUpgrade] = useState(false);

  // Check if user already has a pending seller upgrade request
  const { data: existingRequest, refetch: refetchRequest } = useQuery({
    queryKey: ['seller-upgrade-request', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('admin_approval_requests')
        .select('*')
        .eq('requester_id', user.id)
        .eq('request_type', 'seller_upgrade' as any)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching upgrade request:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id && role === UserRole.CLIENT,
  });

  const handleRequestSellerUpgrade = async () => {
    if (!user?.id) return;
    
    setIsRequestingUpgrade(true);
    try {
      // Check if there's already a pending request
      if (existingRequest?.status === 'pending') {
        toast.info('Ya tienes una solicitud pendiente de aprobación');
        return;
      }

      // Create a new upgrade request
      const { error } = await supabase
        .from('admin_approval_requests')
        .insert({
          requester_id: user.id,
          request_type: 'seller_upgrade' as any,
          status: 'pending',
          metadata: {
            user_email: user.email,
            user_name: user.name,
            requested_at: new Date().toISOString(),
          },
        });

      if (error) throw error;

      toast.success('¡Solicitud enviada! Un administrador revisará tu solicitud pronto.');
      refetchRequest();
    } catch (error) {
      console.error('Error requesting seller upgrade:', error);
      toast.error('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsRequestingUpgrade(false);
    }
  };

  const getUpgradeButtonContent = () => {
    if (existingRequest?.status === 'pending') {
      return (
        <>
          <Clock className="h-6 w-6" />
          <div>
            <h4 className="font-bold text-lg text-amber-700">Solicitud Pendiente</h4>
            <p className="text-sm text-amber-600 mt-1">
              Tu solicitud está siendo revisada por un administrador.
            </p>
          </div>
        </>
      );
    }
    if (existingRequest?.status === 'approved') {
      return (
        <>
          <CheckCircle className="h-6 w-6" />
          <div>
            <h4 className="font-bold text-lg text-green-700">¡Aprobado!</h4>
            <p className="text-sm text-green-600 mt-1">
              Tu cuenta ha sido actualizada a vendedor.
            </p>
          </div>
        </>
      );
    }
    if (existingRequest?.status === 'rejected') {
      return (
        <>
          <Store className="h-6 w-6" />
          <div>
            <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#071d7f] transition-colors">Solicitar de Nuevo</h4>
            <p className="text-sm text-gray-500 mt-1">
              Tu solicitud anterior fue rechazada. Puedes intentar de nuevo.
            </p>
          </div>
        </>
      );
    }
    return (
      <>
        <Store className="h-6 w-6" />
        <div>
          <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#071d7f] transition-colors">Quiero ser Vendedor</h4>
          <p className="text-sm text-gray-500 mt-1">
            Solicita acceso para vender en SIVER Market.
          </p>
        </div>
      </>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {!isMobile && <Header />}
        <main className={`flex-1 container mx-auto px-4 flex items-center justify-center ${isMobile ? 'pb-20' : 'pb-8'}`}>
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-[#071d7f]">Iniciar Sesión</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-muted-foreground">
                Por favor inicia sesión para ver tu perfil.
              </p>
              <Link to="/login">
                <Button className="w-full bg-[#071d7f] hover:bg-[#0a2a9f]">Ir al Login</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        {!isMobile && <Footer />}
      </div>
    );
  }

  const Content = () => (
    <div className={`min-h-screen bg-gray-50/50 flex flex-col font-sans ${isMobile ? 'pb-14' : ''}`}>
      {!isMobile && <Header />}
      
      {/* Modern Hero Section */}
      <div className="relative h-64 w-full overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#071d7f] via-[#0a2a9f] to-[#051560]" />
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
          
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-400/10 rounded-full blur-2xl" />

          <div className="container mx-auto px-6 h-full flex items-end pb-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
                  <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                      <Avatar className="h-32 w-32 border-4 border-white shadow-2xl relative">
                          <AvatarFallback className="text-4xl font-bold bg-white text-[#071d7f]">
                              {user?.name?.substring(0, 2).toUpperCase() || "US"}
                          </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-white rounded-full" title="Online"></div>
                  </div>
                  
                  <div className="mb-2 text-white flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                              <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
                                  {user?.name || "Mi Cuenta"}
                              </h1>
                              <p className="text-blue-100/80 flex items-center gap-2 mt-2 text-lg">
                                  <Mail className="h-4 w-4" />
                                  {user?.email}
                              </p>
                          </div>
                          
                          <div className="flex gap-3">
                              <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Perfil
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="grid gap-8 md:grid-cols-12">
            
            {/* Left Column: User Info */}
            <div className="md:col-span-4 lg:col-span-3 space-y-6">
                <Card className="shadow-lg border-none overflow-hidden sticky top-28 group hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-white border-b">
                    <CardTitle className="text-[#071d7f] flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm group/item p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-2 bg-blue-50 text-[#071d7f] rounded-full">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Nombre Completo</p>
                                <p className="font-medium text-gray-700">{user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm group/item p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-2 bg-blue-50 text-[#071d7f] rounded-full">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-medium text-gray-700">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm group/item p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-2 bg-blue-50 text-[#071d7f] rounded-full">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Miembro desde</p>
                                <p className="font-medium text-gray-700">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Right Column: Actions */}
            <div className="md:col-span-8 lg:col-span-9 space-y-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Link to="/mis-compras" className="flex flex-col items-start p-6 bg-white rounded-xl shadow-md hover:shadow-xl border border-transparent hover:border-blue-100 transition-all duration-300 group text-left">
                        <div className="p-3 rounded-xl bg-blue-50 text-[#071d7f] group-hover:bg-[#071d7f] group-hover:text-white transition-colors mb-4 shadow-sm">
                            <Package className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#071d7f] transition-colors">Mis Compras</h4>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Ver historial y estado de tus compras.
                        </p>
                    </Link>

                    <button 
                        onClick={() => setShowAddresses(true)}
                        className="flex flex-col items-start p-6 bg-white rounded-xl shadow-md hover:shadow-xl border border-transparent hover:border-blue-100 transition-all duration-300 group text-left"
                    >
                        <div className="p-3 rounded-xl bg-blue-50 text-[#071d7f] group-hover:bg-[#071d7f] group-hover:text-white transition-colors mb-4 shadow-sm">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#071d7f] transition-colors">Direcciones</h4>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Gestiona tus direcciones de envío.
                        </p>
                    </button>

                    <button 
                        onClick={() => setShowSettings(true)}
                        className="flex flex-col items-start p-6 bg-white rounded-xl shadow-md hover:shadow-xl border border-transparent hover:border-blue-100 transition-all duration-300 group text-left"
                    >
                        <div className="p-3 rounded-xl bg-blue-50 text-[#071d7f] group-hover:bg-[#071d7f] group-hover:text-white transition-colors mb-4 shadow-sm">
                            <Settings className="h-6 w-6" />
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#071d7f] transition-colors">Configuración</h4>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Preferencias de cuenta y seguridad.
                        </p>
                    </button>

                    {/* Become a Seller Button - Only show for CLIENT role */}
                    {role === UserRole.CLIENT && (
                      <button 
                        onClick={handleRequestSellerUpgrade}
                        disabled={isRequestingUpgrade || existingRequest?.status === 'pending' || existingRequest?.status === 'approved'}
                        className={`flex flex-col items-start p-6 bg-white rounded-xl shadow-md hover:shadow-xl border border-transparent transition-all duration-300 group text-left ${
                          existingRequest?.status === 'pending' 
                            ? 'bg-amber-50 border-amber-200 cursor-default' 
                            : existingRequest?.status === 'approved'
                            ? 'bg-green-50 border-green-200 cursor-default'
                            : 'hover:border-indigo-100'
                        }`}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className={`p-3 rounded-xl transition-colors shadow-sm ${
                            existingRequest?.status === 'pending'
                              ? 'bg-amber-100 text-amber-600'
                              : existingRequest?.status === 'approved'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                          }`}>
                            {isRequestingUpgrade ? <Loader2 className="h-6 w-6 animate-spin" /> : getUpgradeButtonContent().props.children[0]}
                          </div>
                          {getUpgradeButtonContent().props.children[1]}
                        </div>
                      </button>
                    )}

                    <button 
                        onClick={signOut}
                        className="flex flex-col items-start p-6 bg-white rounded-xl shadow-md hover:shadow-xl border border-transparent hover:border-red-100 transition-all duration-300 group text-left md:col-span-2 lg:col-span-3 bg-gradient-to-r hover:from-red-50 hover:to-white"
                    >
                        <div className="flex items-center gap-4 w-full">
                            <div className="p-3 rounded-xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
                                <LogOut className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-900 group-hover:text-red-700 transition-colors">Cerrar Sesión</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Finalizar tu sesión actual.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      </main>
      {!isMobile && <Footer />}
      
      <AddressesDialog open={showAddresses} onOpenChange={setShowAddresses} />
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );

  if (role === UserRole.SELLER) {
    return (
      <SellerLayout>
        <Content />
      </SellerLayout>
    );
  }

  return <Content />;
};

export default AccountPage;
