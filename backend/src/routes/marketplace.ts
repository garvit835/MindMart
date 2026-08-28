import { Router } from 'express';
import * as dotenv from 'dotenv';
import { supabaseAdmin } from '../supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

dotenv.config();

const router = Router();

// Apply auth middleware
router.use(requireAuth);

// POST Fake Checkout Flow using MindCoins
// TODO: This checkout has a TOCTOU race condition. Balance check and stock deduction
// are non-atomic. For production, migrate to a Supabase RPC with serializable transaction
// isolation to prevent double-spending and overselling.
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

    // 3. Re-verify balance to narrow the race window (not a full fix, but reduces risk)
    const { data: recheck } = await supabaseAdmin
      .from('reward_transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId);

    let recheckBalance = 0;
    recheck?.forEach(tx => {
      if (tx.transaction_type === 'earned') recheckBalance += Number(tx.amount);
      if (tx.transaction_type === 'spent') recheckBalance -= Number(tx.amount);
    });

    if (recheckBalance < totalCost) {
      // Rollback stock deductions
      for (const item of items) {
        const { data: product } = await supabaseAdmin.from('products').select('stock').eq('id', item.productId).single();
        if (product) {
          await supabaseAdmin.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.productId);
        }
      }
      return res.status(400).json({ error: 'Balance changed during checkout. Please try again.', currentBalance: recheckBalance, required: totalCost });
    }

    // 4. Create Order
    const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert([{
      buyer_id: userId,
      total_cost_coins: totalCost,
      status: 'processing'
    }]).select().single();

    if (orderError) throw orderError;

    // 5. Create Order Items
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      seller_id: item.sellerId,
      quantity: item.quantity,
      price_at_time: item.priceInMindCoins
    }));

    await supabaseAdmin.from('order_items').insert(orderItemsToInsert);

    // 6. Log Wallet Transaction
    await supabaseAdmin.from('reward_transactions').insert([{
      user_id: userId,
      amount: totalCost,
      transaction_type: 'spent',
      description: `Marketplace Order #${order.id}`
    }]);

    res.json({ success: true, orderId: order.id, newBalance: recheckBalance - totalCost });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
