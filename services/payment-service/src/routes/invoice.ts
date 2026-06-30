import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import jwt from 'jsonwebtoken';
import pool from '../db/mysql';

const router = Router();

function getUser(req: Request): number | null {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return (jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }).userId; } catch { return null; }
}

router.get('/:orderId', async (req: Request, res: Response) => {
  const userId = getUser(req);
  if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

  const [rows]: any = await pool.execute(
    `SELECT p.*, u.name as user_name, u.email FROM payments p
     JOIN users u ON p.user_id = u.id
     WHERE p.order_id = ? AND p.user_id = ? AND p.status = 'success'`,
    [req.params.orderId, userId]
  );
  const payment = rows[0];
  if (!payment) { res.status(404).json({ message: 'Confirmed payment not found' }); return; }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.order_id.slice(0, 8)}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(28).fillColor('#f59e0b').text('⚡ FlashBuy', 50, 50);
  doc.fontSize(10).fillColor('#64748b').text('Payment Service — Official Tax Invoice', 50, 85);
  doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#334155').stroke();

  doc.fontSize(20).fillColor('#1e293b').text('TAX INVOICE', 50, 125);
  doc.fontSize(10).fillColor('#64748b')
    .text(`Invoice #: INV-${payment.order_id.slice(0, 8).toUpperCase()}`, 50, 152)
    .text(`Transaction ID: ${payment.transaction_id}`, 50, 166)
    .text(`Date: ${new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, 180)
    .text(`Status: Payment Successful`, 50, 194);

  doc.fontSize(12).fillColor('#1e293b').text('Bill To:', 350, 125);
  doc.fontSize(10).fillColor('#334155').text(payment.user_name, 350, 145).text(payment.email, 350, 159);

  doc.moveTo(50, 215).lineTo(545, 215).strokeColor('#334155').stroke();
  doc.fontSize(10).fillColor('#64748b')
    .text('ITEM', 50, 230).text('DESCRIPTION', 180, 230)
    .text('QTY', 390, 230).text('PRICE', 460, 230, { align: 'right', width: 85 });
  doc.moveTo(50, 248).lineTo(545, 248).strokeColor('#e2e8f0').stroke();

  doc.fontSize(11).fillColor('#1e293b')
    .text(payment.product_name, 50, 262, { width: 125 })
    .text('Flash Sale Purchase', 180, 262, { width: 200 })
    .text('1', 390, 262)
    .text(`₹${Number(payment.amount).toLocaleString('en-IN')}`, 460, 262, { align: 'right', width: 85 });
  doc.moveTo(50, 295).lineTo(545, 295).strokeColor('#e2e8f0').stroke();

  const price = Number(payment.amount);
  const gst = Math.round(price * 0.18);
  const total = price + gst;

  doc.fontSize(10).fillColor('#64748b')
    .text('Subtotal:', 380, 315).text(`₹${price.toLocaleString('en-IN')}`, 460, 315, { align: 'right', width: 85 })
    .text('GST (18%):', 380, 332).text(`₹${gst.toLocaleString('en-IN')}`, 460, 332, { align: 'right', width: 85 });
  doc.moveTo(380, 350).lineTo(545, 350).strokeColor('#334155').stroke();
  doc.fontSize(13).fillColor('#f59e0b')
    .text('Total:', 380, 360).text(`₹${total.toLocaleString('en-IN')}`, 460, 360, { align: 'right', width: 85 });

  doc.roundedRect(50, 410, 495, 55, 8).fillColor('#f0fdf4').stroke();
  doc.fontSize(9).fillColor('#15803d')
    .text('✓ Payment Verified', 70, 425)
    .text(`Order ID: ${payment.order_id}  ·  Processed by FlashBuy Payment Service`, 70, 440);

  doc.moveTo(50, 695).lineTo(545, 695).strokeColor('#e2e8f0').stroke();
  doc.fontSize(9).fillColor('#94a3b8')
    .text('Thank you for shopping with FlashBuy!', 50, 710, { align: 'center', width: 495 })
    .text('This is a computer-generated invoice and does not require a signature.', 50, 723, { align: 'center', width: 495 });

  doc.end();
});

export default router;
