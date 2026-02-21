import { db } from '$lib/server/db';
import { customer, invoice, settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateInvoicePdf } from '$lib/server/pdf';
import { createTransport } from 'nodemailer';
import { env } from '$env/dynamic/private';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function sendInvoiceEmail(invoice_number: number) {
	const results = await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			invoice_date: invoice.invoice_date,
			due_date: invoice.due_date,
			items: invoice.items,
			total: invoice.total,
			paid: invoice.paid,
			timesheet_image: invoice.timesheet_image,
			customer_name: customer.name,
			customer_email: customer.email,
			customer_address: customer.address
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id))
		.where(eq(invoice.invoice_number, invoice_number));

	const inv = results[0];
	if (!inv) throw new Error('Invoice not found');

	const getSettingValue = async (key: string) => {
		const result = await db.select().from(settings).where(eq(settings.key, key));
		return result[0]?.value;
	};

	const [payto, account, sort, address, email] = await Promise.all([
		getSettingValue('payment_name'),
		getSettingValue('account_number'),
		getSettingValue('sort_code'),
		getSettingValue('address'),
		getSettingValue('email')
	]);

	const pdfBuffer = await generateInvoicePdf(inv, { payto, account, sort, address, email });

	const attachments: { filename: string; content: Buffer; contentType: string }[] = [
		{
			filename: `INV-${inv.invoice_number}.pdf`,
			content: pdfBuffer,
			contentType: 'application/pdf'
		}
	];

	if (inv.timesheet_image) {
		const imagePath = join(process.cwd(), 'uploads', inv.timesheet_image);
		const imageBuffer = await readFile(imagePath);
		const ext = inv.timesheet_image.split('.').pop()?.toLowerCase() ?? 'png';
		const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
		attachments.push({
			filename: inv.timesheet_image,
			content: imageBuffer,
			contentType: mimeType
		});
	}

	const transporter = createTransport({
		host: env.SMTP_HOST,
		port: Number(env.SMTP_PORT),
		secure: true,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASS
		}
	});

	await transporter.sendMail({
		from: env.SMTP_FROM,
		to: inv.customer_email,
		bcc: env.SMTP_FROM,
		subject: `Invoice INV-${inv.invoice_number}`,
		text: `Hi ${inv.customer_name},\n\nPlease find attached invoice INV-${inv.invoice_number}.\n\nThank you.`,
		attachments
	});

	await db.update(invoice).set({ emailed: 1 }).where(eq(invoice.id, inv.id));
}
