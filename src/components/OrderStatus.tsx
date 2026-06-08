import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Clock } from 'lucide-react';

export default function OrderStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const tableNumber = localStorage.getItem('scanbite_table') || '';

  useEffect(() => {
    if (!tableNumber) return;

    // Fetch initial
    const fetchStatus = async () => {
      // Trying to construct a robust query
      const { data, error } = await supabase
        .from('sb_orders')
        .select('status')
        .eq('table_number', tableNumber) // Try exact match first
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setStatus(data.status);
    };
    fetchStatus();

    // Subscribe
    const channel = supabase
      .channel('sb_orders_channel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sb_orders',
        filter: `table_number=eq."${tableNumber}"`,
      }, (payload) => {
        setStatus(payload.new.status);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableNumber]);

  if (!status) return null;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-xs mt-4">
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-orange-600" />
        <div>
          <p className="text-[10px] font-black uppercase text-orange-800">Status Pesanan</p>
          <p className="text-xs font-bold text-orange-950 capitalize">{status}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-200 text-orange-900'}`}>
        {status === 'delivered' ? 'Selesai' : 'Sedang Diproses'}
      </span>
    </div>
  );
}
