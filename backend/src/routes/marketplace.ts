import { Router } from 'express';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

dotenv.config();

const router = Router();

// Apply auth middleware
router.use(requireAuth);

// POST Fake Checkout Flow using MindCoins
router.post('/checkout', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    // items = [{ productId, sellerId, quantity, priceInMindCoins }]

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'items are required' });
    }

    // Calculate total cost
    const totalCost = items.reduce((acc: number, item: any) => acc + (item.priceInMindCoins * item.quantity), 0);

    // 1. Verify User Balance (Sum of earned minus sum of spent from reward_transactions)
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('reward_transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId);

    if (txError) throw txError;

    let balance = 0;
    transactions?.forEach(tx => {
      if (tx.transaction_type === 'earned') balance += Number(tx.amount);
      if (tx.transaction_type === 'spent') balance -= Number(tx.amount);
    });

    if (balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient MindCoins balance', currentBalance: balance, required: totalCost });
    }

    // 2. Deduct Stock for all products
    for (const item of items) {
      const { data: product } = await supabaseAdmin.from('products').select('stock').eq('id', item.productId).single();
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ error: `Product ${item.productId} is out of stock.` });
      }
      await supabaseAdmin.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.productId);
    }

    // 3. Create Order
    const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert([{
      buyer_id: userId,
      total_cost_coins: totalCost,
      status: 'processing'
    }]).select().single();

    if (orderError) throw orderError;

    // 4. Create Order Items
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      seller_id: item.sellerId,
      quantity: item.quantity,
      price_at_time: item.priceInMindCoins
    }));

    await supabaseAdmin.from('order_items').insert(orderItemsToInsert);

    // 5. Log Wallet Transaction
    await supabaseAdmin.from('reward_transactions').insert([{
      user_id: userId,
      amount: totalCost,
      transaction_type: 'spent',
      description: `Marketplace Order #${order.id}`
    }]);

    res.json({ success: true, orderId: order.id, newBalance: balance - totalCost });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
