import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PendingQuote {
  id: string;
  quote_number: string;
  seller_id: string;
  cart_snapshot: any;
  total_amount: number;
  total_quantity: number;
  status: string;
  seller_notes: string | null;
  admin_notes: string | null;
  whatsapp_sent_at: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  seller_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

export function useAdminQuotes(statusFilter?: string) {
  const [quotes, setQuotes] = useState<PendingQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('pending_quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: quotesData, error } = await query;

      if (error) throw error;

      // Fetch seller profiles separately
      if (quotesData && quotesData.length > 0) {
        const sellerIds = [...new Set(quotesData.map(q => q.seller_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', sellerIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const quotesWithProfiles = quotesData.map(q => ({
          ...q,
          seller_profile: profilesMap.get(q.seller_id) || null
        }));
        
        setQuotes(quotesWithProfiles as PendingQuote[]);
      } else {
        setQuotes([]);
      }
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cotizaciones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter]);

  const updateQuoteStatus = async (quoteId: string, status: string, adminNotes?: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (adminNotes !== undefined) {
        updateData.admin_notes = adminNotes;
      }
      
      if (status === 'responded' || status === 'approved' || status === 'rejected') {
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('pending_quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `La cotización ha sido marcada como ${status}`,
      });

      fetchQuotes();
    } catch (error: any) {
      console.error('Error updating quote:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  return { quotes, isLoading, refetch: fetchQuotes, updateQuoteStatus };
}

export function useSellerQuotes() {
  const [quotes, setQuotes] = useState<PendingQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuotes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_quotes')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes((data as PendingQuote[]) || []);
    } catch (error: any) {
      console.error('Error fetching seller quotes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus cotizaciones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  return { quotes, isLoading, refetch: fetchQuotes };
}
