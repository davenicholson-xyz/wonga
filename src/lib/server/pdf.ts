import PDFDocument from 'pdfkit';

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		maximumFractionDigits: 0
	}).format(amount);

type InvoiceData = {
	invoice_number: number;
	invoice_date: Date;
	due_date: Date;
	items: string;
	total: number;
	paid: number;
	customer_name: string;
	customer_email: string;
	customer_address: string;
};

type PaymentDetails = {
	payto?: string;
	account?: string;
	sort?: string;
	address?: string;
	email?: string;
};

export async function generateInvoicePdf(
	inv: InvoiceData,
	payment?: PaymentDetails
): Promise<Buffer> {
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

	const grey = '#6b7280';
	const dark = '#111827';
	const light = '#9ca3af';

	// -- Invoice number --
	doc.fontSize(20).fillColor(dark).text(`INV-${inv.invoice_number}`, 50, 50);

	if (inv.paid) {
		doc.fontSize(10).fillColor('#16a34a').text('PAID', 50, 75);
	}

	// -- Sender details (left) and Bill To (right) on the same line --
	const rightX = 350;
	const detailsY = 100;

	// Sender (left column)
	let leftY = detailsY;
	if (payment?.payto) {
		doc.fontSize(10).fillColor(dark).text(payment.payto, 50, leftY);
		leftY += 14;
	}
	if (payment?.address) {
		for (const line of payment.address.split('\n')) {
			doc.fontSize(9).fillColor(grey).text(line, 50, leftY);
			leftY += 13;
		}
	}
	if (payment?.email) {
		doc.fontSize(9).fillColor(grey).text(payment.email, 50, leftY);
		leftY += 13;
	}

	// Bill To (right column, same starting Y)
	doc.fontSize(8).fillColor(light).text('BILL TO', rightX, detailsY);
	doc
		.fontSize(10)
		.fillColor(dark)
		.text(inv.customer_name, rightX, detailsY + 12);

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

	// -- Dates row below both columns --
	const datesY = Math.max(leftY, billY) + 20;

	doc.fontSize(8).fillColor(light).text('INVOICE DATE', 50, datesY);
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
			datesY + 12
		);

	doc.fontSize(8).fillColor(light).text('DUE DATE', rightX, datesY);
	doc
		.fontSize(10)
		.fillColor(dark)
		.text(
			new Date(inv.due_date).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
			rightX,
			datesY + 12
		);

	const tableTop = datesY + 50;
	const col1 = 50;
	const col2 = 310;
	const col3 = 390;
	const col4 = 470;
	const pageRight = 545;

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

	doc
		.moveTo(col1, rowY + 5)
		.lineTo(pageRight, rowY + 5)
		.strokeColor('#e5e7eb')
		.lineWidth(1)
		.stroke();

	const totalY = rowY + 20;
	doc
		.fontSize(8)
		.fillColor(light)
		.text('TOTAL', col4, totalY, {
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

	// -- Payment details --
	if (payment?.payto || payment?.account || payment?.sort) {
		let payY = totalY + 150;

		doc
			.moveTo(col1, payY - 5)
			.lineTo(pageRight, payY - 5)
			.strokeColor('#e5e7eb')
			.lineWidth(1)
			.stroke();

		doc.fontSize(8).fillColor(light).text('PAYMENT DETAILS', col1, payY);
		payY += 15;

		if (payment.payto) {
			doc.fontSize(8).fillColor(light).text('PAY TO', col1, payY);
			doc
				.fontSize(10)
				.fillColor(dark)
				.text(payment.payto, col1, payY + 12);
			payY += 30;
		}
		if (payment.account) {
			doc.fontSize(8).fillColor(light).text('ACCOUNT', col1, payY);
			doc
				.fontSize(10)
				.fillColor(dark)
				.text(payment.account, col1, payY + 12);
			payY += 30;
		}
		if (payment.sort) {
			doc.fontSize(8).fillColor(light).text('SORT CODE', col1, payY);
			doc
				.fontSize(10)
				.fillColor(dark)
				.text(payment.sort, col1, payY + 12);
		}
	}

	doc.end();

	return pdfReady;
}
