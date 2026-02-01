import { form, query, command } from '$app/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customer, invoice, settings } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { generateInvoicePdf } from '$lib/server/pdf';
import { createTransport } from 'nodemailer';
import { env } from '$env/dynamic/private';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as v from 'valibot';

export const get_invoice = query(v.number(), async (invoice_number) => {
	const results = await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			invoice_date: invoice.invoice_date,
			due_date: invoice.due_date,
			items: invoice.items,
			total: invoice.total,
			paid: invoice.paid,
			emailed: invoice.emailed,
			timesheet_image: invoice.timesheet_image,
			customer_name: customer.name,
			customer_email: customer.email,
			customer_address: customer.address
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id))
		.where(eq(invoice.invoice_number, invoice_number));
	return results[0] ?? null;
});

export const mark_paid = command(v.string(), async (id) => {
	const [{ invoice_number }] = await db
		.update(invoice)
		.set({ paid: 1 })
		.where(eq(invoice.id, id))
		.returning({ invoice_number: invoice.invoice_number });

	get_invoice(invoice_number).refresh();
	get_invoices().refresh();
});

export const get_next_invoice_number = query(async () => {
	const lastInvoice = await db.query.invoice.findMany({
		orderBy: [desc(invoice.invoice_number)],
		limit: 1
	});
	return lastInvoice.length > 0 ? lastInvoice[0].invoice_number + 1 : 1;
});

export const get_invoices = query(async () => {
	return await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			customer_id: invoice.customer_id,
			invoice_date: invoice.invoice_date,
			due_date: invoice.due_date,
			items: invoice.items,
			total: invoice.total,
			customer_name: customer.name,
			paid: invoice.paid
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id));
});

export const send_invoice = command(v.number(), async (invoice_number) => {
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

	const [payto, account, sort] = await Promise.all([
		getSettingValue('invoice_payto'),
		getSettingValue('invoice_account'),
		getSettingValue('invoice_sort')
	]);

	const pdfBuffer = await generateInvoicePdf(inv, { payto, account, sort });

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
		subject: `Invoice INV-${inv.invoice_number}`,
		text: `Hi ${inv.customer_name},\n\nPlease find attached invoice INV-${inv.invoice_number}.\n\nThank you.`,
		attachments
	});

	await db.update(invoice).set({ emailed: 1 }).where(eq(invoice.id, inv.id));
	get_invoice(invoice_number).refresh();
});

export const create_invoice = form(
	v.object({
		invoice_number: v.number(),
		customer_id: v.string(),
		invoice_date: v.string(),
		due_date: v.string(),
		items: v.string(),
		total: v.number()
	}),
	async ({ invoice_number, customer_id, invoice_date, due_date, items, total }) => {
		await db.insert(invoice).values({
			invoice_number,
			customer_id,
			invoice_date: new Date(invoice_date),
			due_date: new Date(due_date),
			items,
			total
		});
		redirect(307, '/invoices');
	}
);
