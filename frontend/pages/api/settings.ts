import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hteqspsufvevhnrilvbf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZXFzcHN1ZnZldmhucmlsdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDE4NTIsImV4cCI6MjA4MjcxNzg1Mn0.ALEiZkHHwCaDRCBGCD28nIsgMkd5kT-pzXf7pscrvtE'
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data || {
      phone_number: null,
      notifications_enabled: 1,
      email: null,
      email_notifications_enabled: 1,
      notification_frequency: 'immediate'
    });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const { phone_number, notifications_enabled, email, email_notifications_enabled, notification_frequency } = req.body;

    const { data: existing } = await supabase.from('settings').select('id').single();

    if (existing?.id) {
      const { error } = await supabase.from('settings').update({
        phone_number,
        notifications_enabled,
        email,
        email_notifications_enabled,
        notification_frequency
      }).eq('id', existing.id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      const { error } = await supabase.from('settings').insert([{
        phone_number,
        notifications_enabled,
        email,
        email_notifications_enabled,
        notification_frequency
      }]);
      if (error) return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Settings sauvegardés' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
