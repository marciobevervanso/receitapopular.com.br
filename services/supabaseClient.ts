
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awwkzlfjlpktfzmcpjiw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2t6bGZqbHBrdGZ6bWNwaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzU2NTcsImV4cCI6MjA3OTUxMTY1N30.IoZmjXug5WVy9LCICHff93Sz4_ruNTleI7Xn6e88nDQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
