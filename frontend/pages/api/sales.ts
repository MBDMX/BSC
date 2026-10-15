import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hteqspsufvevhnrilvbf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZXFzcHN1ZnZldmhucmlsdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDE4NTIsImV4cCI6MjA4MjcxNzg1Mn0.ALEiZkHHwCaDRCBGCD28nIsgMkd5kT-pzXf7pscrvtE'
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST') {
    const { produit_nom, produit_id, quantite, prix_unitaire, date } = req.body;
    const total = quantite * prix_unitaire;

    const { data, error } = await supabase.from('sales').insert([{
      produit_nom,
      quantite,
      prix_unitaire,
      total,
      date: date || new Date().toISOString()
    }]).select().single();

    if (error) return res.status(500).json({ error: error.message });

    // Deduct stock from Supabase based on recipes table
    if (produit_id) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('ingredient_id, quantity')
        .eq('product_id', produit_id);

      if (recipes && recipes.length > 0) {
        for (const item of recipes) {
          const { data: ingredient } = await supabase
            .from('products')
            .select('quantite')
            .eq('id', item.ingredient_id)
            .single();

          if (ingredient) {
            const newQty = Math.max(0, (ingredient.quantite || 0) - (item.quantity * quantite));
            await supabase.from('products').update({ quantite: newQty }).eq('id', item.ingredient_id);
          }
        }
      }
    }

    return res.status(201).json({ message: 'Vente enregistrée', sale: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requis' });
    const { error } = await supabase.from('sales').delete().eq('id', Number(id));
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Vente supprimée' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
