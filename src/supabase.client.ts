import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rjkakwwqvhxceqxzqhyf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqa2Frd3dxdmh4Y2VxeHpxaHlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMxOTUwOSwiZXhwIjoyMDg5ODk1NTA5fQ.MC1ATTnL-keWLJadAX8VE2AlWKECpifTju_71WEOg0E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
