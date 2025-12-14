import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function para verificar roles de usuario
 * Proporciona doble seguridad verificando roles en el backend
 * 
 * Uso:
 * POST /verify-role
 * Body: { requiredRoles: ['admin', 'seller'] }
 * Headers: Authorization: Bearer <JWT>
 * 
 * Response:
 * { authorized: boolean, userRole: string, userId: string }
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[verify-role] Starting role verification...');

    // Obtener el token JWT del header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[verify-role] No authorization header provided');
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'No authorization header provided' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Crear cliente Supabase con el token del usuario
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Cliente admin para verificar roles
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Cliente con token del usuario para verificar autenticación
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verificar el usuario autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.log('[verify-role] Invalid or expired token:', userError?.message);
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[verify-role] User authenticated: ${user.id}`);

    // Obtener los roles requeridos del body
    const { requiredRoles } = await req.json().catch(() => ({ requiredRoles: [] }));
    
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      console.log('[verify-role] No required roles specified, allowing access');
      return new Response(
        JSON.stringify({ 
          authorized: true, 
          userId: user.id,
          userRole: null,
          message: 'No specific role required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el rol del usuario desde la base de datos usando cliente admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('[verify-role] Error fetching user role:', roleError);
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          error: 'Error fetching user role' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userRole = roleData?.role || 'user';
    console.log(`[verify-role] User role: ${userRole}, Required roles: ${requiredRoles.join(', ')}`);

    // Mapeo de roles (BD usa 'user', app usa 'client')
    const normalizedUserRole = userRole === 'user' ? 'client' : userRole;
    const normalizedRequiredRoles = requiredRoles.map((r: string) => 
      r === 'client' ? 'user' : r
    );

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRequiredRole = normalizedRequiredRoles.includes(userRole) || 
                            requiredRoles.includes(normalizedUserRole);

    if (!hasRequiredRole) {
      console.log(`[verify-role] Access denied. User role '${userRole}' not in required roles`);
      return new Response(
        JSON.stringify({ 
          authorized: false, 
          userId: user.id,
          userRole: normalizedUserRole,
          error: 'Insufficient permissions' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[verify-role] Access granted for user ${user.id} with role ${userRole}`);
    return new Response(
      JSON.stringify({ 
        authorized: true, 
        userId: user.id,
        userRole: normalizedUserRole,
        message: 'Access granted'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-role] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        authorized: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
