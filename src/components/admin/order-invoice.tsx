'use client';

import React from 'react';
import type { Order } from '@/lib/types';
import { format } from 'date-fns';

interface OrderInvoiceProps {
    order: Order;
}

export const OrderInvoice = React.forwardRef<HTMLDivElement, OrderInvoiceProps>(({ order }, ref) => {
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = order.total - subtotal;

    return (
        <div ref={ref} className="p-8 font-sans bg-white text-black">
            <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">INVOICE</h1>
                    <p className="text-gray-600">Order #{order.id.slice(-6)}</p>
                </div>
                <div className="text-right">
                    {/* You can add a logo here */}
                    <h2 className="text-2xl font-bold">BazaarGo</h2>
                    <p className="text-gray-500 text-sm">Your one-stop online marketplace.</p>
                </div>
            </header>
            
            <section className="mt-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">Billed To:</h3>
                    <p className="text-gray-800 font-bold">{order.shippingInfo.name}</p>
                    <p>{order.shippingInfo.street}</p>
                    <p>{order.shippingInfo.city}, {order.shippingInfo.zip}</p>
                    <p>{order.shippingInfo.phone}</p>
                    <p>{order.shippingInfo.email}</p>
                </div>
                <div className="text-right">
                    <p><strong className="text-gray-700">Invoice Date:</strong> {format(new Date(), "PPP")}</p>
                    <p><strong className="text-gray-700">Order Date:</strong> {format(new Date(order.date), "PPP")}</p>
                </div>
            </section>
            
            <section className="mt-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">
                                    <p className="font-semibold">{item.name}</p>
                                    {(item.selectedSize || item.selectedColor) && (
                                        <p className="text-sm text-gray-600">
                                            {[item.selectedSize, item.selectedColor?.name].filter(Boolean).join(' / ')}
                                        </p>
                                    )}
                                </td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">৳{item.price.toFixed(2)}</td>
                                <td className="p-3 text-right">৳{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="mt-8 flex justify-end">
                <div className="w-full max-w-xs space-y-2 text-gray-700">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>৳{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>৳{shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl text-gray-800 pt-2 border-t-2 border-gray-800">
                        <span>Total</span>
                        <span>৳{order.total.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Payment Method</span>
                        <span className="capitalize">{order.paymentDetails?.method}</span>
                    </div>
                </div>
            </section>
            
            <footer className="mt-16 pt-4 border-t-2 text-center text-gray-500 text-sm">
                <p>Thank you for your business!</p>
                <p>BazaarGo | support@bazaargo.com</p>
            </footer>
        </div>
    );
});
OrderInvoice.displayName = 'OrderInvoice';