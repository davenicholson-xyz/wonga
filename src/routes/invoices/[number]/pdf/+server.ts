import { db } from '$lib/server/db';
import { invoice, customer } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { generateInvoicePdf } from '$lib/server/pdf';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const invoiceNumber = parseInt(params.number);

	const results = await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			invoice_date: invoice.invoice_date,
			due_date: invoice.due_date,
			items: invoice.items,
			total: invoice.total,
			paid: invoice.paid,
			customer_name: customer.name,
			customer_email: customer.email,
			customer_address: customer.address
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id))
		.where(eq(invoice.invoice_number, invoiceNumber));

	const inv = results[0];
	if (!inv) throw error(404, 'Invoice not found');

	const pdfBuffer = await generateInvoicePdf(inv);

	return new Response(pdfBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="INV-${inv.invoice_number}.pdf"`
		}
	});
};
