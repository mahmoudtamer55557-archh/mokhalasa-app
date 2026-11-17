/**
 * Vercel Serverless Function / Keep-Alive Cron
 * Pings Supabase automatically to prevent free-tier pausing due to inactivity.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nngwnchzqilqphwrqqin.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZ3duY2h6cWlscXBod3JxcWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjI0NTcsImV4cCI6MjEwODE5ODQ1N30.WxIxxLytpP2dEGo6O5Rn3hU1MSTfXq_zRgUovUZu7sU';

export default async function handler(req, res) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('car_listings').select('id').limit(1);

    return res.status(200).json({
      success: true,
      message: 'Mokhalasa Supabase keep-alive ping successful.',
      count: data?.length || 0,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: err?.message || 'Ping executed',
      timestamp: new Date().toISOString()
    });
  }
}
