import { supabase } from '../supabaseClient'; // Pastikan path ke supabaseClient benar

export const table = (tableName: string) => {
  return supabase.from(tableName).eq('tenant_id', 'scanbite_live');
};