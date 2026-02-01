import { db } from '$lib/server/db';
import { invoice, customer } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import PDFDocument from 'pdfkit';
import type { RequestHandler } from './$types';

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0
	}).format(amount);

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

	type InvoiceItem = {
		name: string;
		description: string;
		price: number;
		quantity: number;
	};

	const items: InvoiceItem[] = JSON.parse(inv.items);

	const doc = new PDFDocument({ size: 'A4', margin: 50 });
	const chunks: Buffer[] = [];

	doc.on('data', (chunk: Buffer) => chunks.push(chunk));

	const pdfReady = new Promise<Buffer>((resolve) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)));
	});

	// -- Header --
	const grey = '#6b7280';
	const dark = '#111827';
	const light = '#9ca3af';
	const accent = '#4f46e5';

	doc.fontSize(28).fillColor(accent).text('INVOICE', 50, 50);

	doc
		.fontSize(10)
		.fillColor(dark)
		.text(`INV-${inv.invoice_number}`, 50, 85);

	if (inv.paid) {
		doc.fontSize(10).fillColor('#16a34a').text('PAID', 150, 85);
	}

	// -- Invoice details (left) --
	const detailsY = 120;

	doc.fontSize(8).fillColor(light).text('INVOICE DATE', 50, detailsY);
	doc
		.fontSize(10)
		.fillColor(dark)
		.text(
			new Date(inv.invoice_date).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
			50,
			detailsY + 12
		);

	doc.fontSize(8).fillColor(light).text('DUE DATE', 50, detailsY + 35);
	doc
		.fontSize(10)
		.fillColor(dark)
		.text(
			new Date(inv.due_date).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
			50,
			detailsY + 47
		);

	// -- Bill To (right) --
	const rightX = 350;
	doc.fontSize(8).fillColor(light).text('BILL TO', rightX, detailsY);
	doc.fontSize(10).fillColor(dark).text(inv.customer_name, rightX, detailsY + 12);

	let billY = detailsY + 26;
	if (inv.customer_address) {
		for (const line of inv.customer_address.split('\n')) {
			doc.fontSize(9).fillColor(grey).text(line, rightX, billY);
			billY += 13;
		}
	}
	if (inv.customer_email) {
		doc.fontSize(9).fillColor(grey).text(inv.customer_email, rightX, billY);
	}

	// -- Items table --
	const tableTop = 220;
	const col1 = 50;
	const col2 = 310;
	const col3 = 390;
	const col4 = 470;
	const pageRight = 545;

	// Header line
	doc
		.moveTo(col1, tableTop - 5)
		.lineTo(pageRight, tableTop - 5)
		.strokeColor('#e5e7eb')
		.lineWidth(1)
		.stroke();

	doc.fontSize(8).fillColor(light);
	doc.text('ITEM', col1, tableTop);
	doc.text('QTY', col2, tableTop, { width: 60, align: 'right' });
	doc.text('PRICE', col3, tableTop, { width: 70, align: 'right' });
	doc.text('TOTAL', col4, tableTop, { width: pageRight - col4, align: 'right' });

	doc
		.moveTo(col1, tableTop + 15)
		.lineTo(pageRight, tableTop + 15)
		.strokeColor('#e5e7eb')
		.lineWidth(1)
		.stroke();

	// Rows
	let rowY = tableTop + 25;

	for (const item of items) {
		const lineTotal = item.price * item.quantity;

		doc.fontSize(10).fillColor(dark).text(item.name, col1, rowY, { width: 250 });

		if (item.description) {
			doc
				.fontSize(8)
				.fillColor(grey)
				.text(item.description, col1, rowY + 14, { width: 250 });
		}

		doc
			.fontSize(10)
			.fillColor(dark)
			.text(String(item.quantity), col2, rowY, { width: 60, align: 'right' });
		doc
			.fontSize(10)
			.fillColor(dark)
			.text(formatCurrency(item.price), col3, rowY, { width: 70, align: 'right' });
		doc
			.fontSize(10)
			.fillColor(dark)
			.text(formatCurrency(lineTotal), col4, rowY, {
				width: pageRight - col4,
				align: 'right'
			});

		rowY += item.description ? 35 : 22;
	}

	// Bottom line
	doc
		.moveTo(col1, rowY + 5)
		.lineTo(pageRight, rowY + 5)
		.strokeColor('#e5e7eb')
		.lineWidth(1)
		.stroke();

	// -- Total --
	const totalY = rowY + 20;
	doc.fontSize(8).fillColor(light).text('TOTAL', col4, totalY, {
		width: pageRight - col4,
		align: 'right'
	});
	doc
		.fontSize(18)
		.fillColor(dark)
		.text(formatCurrency(inv.total), col4, totalY + 14, {
			width: pageRight - col4,
			align: 'right'
		});

	doc.end();

	const pdfBuffer = await pdfReady;

	return new Response(pdfBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `inline; filename="INV-${inv.invoice_number}.pdf"`
		}
	});
};
