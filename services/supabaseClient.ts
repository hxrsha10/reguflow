
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hxhawadoxkikxgdgljrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aGF3YWRveGtpa3hnZGdsanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ5MDYsImV4cCI6MjA4MzQ2MDkwNn0.VM03Wzdl2Lw_RbkeA5US3bhX-46lnYYv8ijMQUS_uVs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
