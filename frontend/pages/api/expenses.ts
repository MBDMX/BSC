import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { year, month } = req.query;
    let query = supabase.from('expenses').select('*').order('date', { ascending: false });
    if (year) query = query.eq('year', Number(year));
    if (month) query = query.eq('month', Number(month));
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const { nom, type, montant, date, recurrence, quantite, unite, year, month } = req.body;
    const d = new Date(date || new Date());
    const { data, error } = await supabase.from('expenses').insert([{
      nom,
      type,
      montant,
      date: date || d.toISOString().split('T')[0],
      recurrence: recurrence || 'AUCUNE',
      quantite: quantite || null,
      unite: unite || null,
      year: year || d.getFullYear(),
      month: month || (d.getMonth() + 1),
    }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ message: 'Dépense enregistrée', expense: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requis' });
    const { error } = await supabase.from('expenses').delete().eq('id', Number(id));
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Dépense supprimée' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
