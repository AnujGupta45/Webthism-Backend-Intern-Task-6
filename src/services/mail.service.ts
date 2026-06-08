import { getMailTransporter } from '../config/mail';
import nodemailer from 'nodemailer';

export class MailService {
  private static async sendMail(options: nodemailer.SendMailOptions): Promise<any> {
    try {
      const transporter = await getMailTransporter();
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"E-Commerce Store" <noreply@ecommerce.com>',
        ...options,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ Email sent: ${info.messageId}`);
      
      // If Ethereal test SMTP is used, log the preview link
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [SMTP Preview] View sent email at: ${previewUrl}`);
      }
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  public static async sendOrderConfirmation(
    to: string,
    name: string,
    order: {
      id: string;
      totalAmount: number;
      shippingAddress: string;
      items: Array<{
        product: { name: string };
        quantity: number;
        price: number;
      }>;
    }
  ): Promise<any> {
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); color: #333;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #4F46E5; margin: 0; font-size: 24px; font-weight: 700;">Order Confirmed!</h2>
          <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">Thank you for shopping with us.</p>
        </div>
        
        <p>Hi <strong>${name}</strong>,</p>
        <p>We've received your order and are preparing it for shipment. Below are your purchase details:</p>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #F3F4F6;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #4B5563;"><strong>Order ID:</strong> <span style="font-family: monospace; font-size: 15px; color: #111827;">${order.id}</span></p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #4B5563;"><strong>Payment Status:</strong> <span style="color: #059669; font-weight: 600;">PAID</span></p>
          <p style="margin: 0; font-size: 14px; color: #4B5563;"><strong>Shipping Address:</strong> <span style="color: #111827;">${order.shippingAddress}</span></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <thead>
            <tr style="background-color: #F9FAFB;">
              <th style="padding: 12px 10px; text-align: left; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-size: 14px;">Product</th>
              <th style="padding: 12px 10px; text-align: center; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-size: 14px;">Qty</th>
              <th style="padding: 12px 10px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-size: 14px;">Price</th>
              <th style="padding: 12px 10px; text-align: right; border-bottom: 2px solid #E5E7EB; color: #4B5563; font-size: 14px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 10px;"></td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 16px; color: #4B5563;">Grand Total:</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #4F46E5;">$${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center;">
          <p style="font-size: 13px; color: #9CA3AF; margin: 0;">
            If you have any questions regarding your order, please do not hesitate to contact us.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to,
      subject: `Order Confirmation - #${order.id.slice(0, 8)}`,
      html,
    });
  }

  public static async sendShippingUpdate(
    to: string,
    name: string,
    order: {
      id: string;
      status: string;
    }
  ): Promise<any> {
    const statusText = order.status.toUpperCase();
    const isShipped = order.status.toLowerCase() === 'shipped';
    const message = isShipped
      ? "Great news! Your order has been shipped and is on its way to you."
      : "Your order has been marked as delivered. We hope you love your products!";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); color: #333;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #4F46E5; margin: 0; font-size: 24px; font-weight: 700;">Order Status Update</h2>
          <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">Your order has been processed.</p>
        </div>
        
        <p>Hi <strong>${name}</strong>,</p>
        <p>${message}</p>
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #F3F4F6; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #4B5563;">Order Reference ID: <span style="font-family: monospace; font-size: 15px; color: #111827;">${order.id}</span></p>
          <p style="margin: 0; font-size: 16px; color: #4B5563;">Current Status: <span style="color: #4F46E5; font-weight: 700; font-size: 18px;">${statusText}</span></p>
        </div>

        <p>You can track this order's details and history anytime in your account dashboard.</p>
        
        <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; margin-top: 30px;">
          <p style="font-size: 13px; color: #9CA3AF; margin: 0;">
            Thank you for being our valued customer.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({
      to,
      subject: `Order Update #${order.id.slice(0, 8)}: ${statusText}`,
      html,
    });
  }
}
