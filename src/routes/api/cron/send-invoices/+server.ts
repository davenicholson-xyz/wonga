import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { invoice, customer, settings } from '$lib/server/db/schema';
import { eq, and, lte, inArray } from 'drizzle-orm';
import { sendInvoiceEmail } from '$lib/server/send-invoice';
import { createTransport } from 'nodemailer';

export const GET: RequestHandler = async ({ url }) => {
	const key = url.searchParams.get('key');
	if (!env.CRON_SECRET || key !== env.CRON_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if auto-send is enabled
	const enabledRow = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'auto_send_enabled'));
	if (enabledRow[0]?.value !== '1') {
		return json({ status: 'disabled', message: 'Auto-send is not enabled' });
	}

	// Check if it's past the configured send time
	const timeRow = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'auto_send_time'));
	const sendTime = timeRow[0]?.value ?? '09:00';
	const [sendHour, sendMinute] = sendTime.split(':').map(Number);

	const now = new Date();
	if (now.getHours() < sendHour || (now.getHours() === sendHour && now.getMinutes() < sendMinute)) {
		return json({ status: 'too_early', message: `Waiting until ${sendTime}` });
	}

	// Check require_timesheet setting
	const requireTimesheetRow = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'auto_send_require_timesheet'));
	const requireTimesheet = requireTimesheetRow[0]?.value === '1';

	// Find eligible invoices: auto_send=1, emailed=0, invoice_date <= today
	const today = new Date();
	today.setHours(23, 59, 59, 999);

	const eligible = await db
		.select({
			id: invoice.id,
			invoice_number: invoice.invoice_number,
			timesheet_image: invoice.timesheet_image,
			customer_name: customer.name
		})
		.from(invoice)
		.innerJoin(customer, eq(invoice.customer_id, customer.id))
		.where(and(eq(invoice.auto_send, 1), eq(invoice.emailed, 0), lte(invoice.invoice_date, today)));

	const sent: number[] = [];
	const skipped: number[] = [];
	const failed: { invoice_number: number; error: string }[] = [];

	for (const inv of eligible) {
		// Skip if timesheet required but not attached
		if (requireTimesheet && !inv.timesheet_image) {
			skipped.push(inv.invoice_number);
			continue;
		}

		try {
			await sendInvoiceEmail(inv.invoice_number);
			sent.push(inv.invoice_number);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			failed.push({ invoice_number: inv.invoice_number, error: errorMessage });

			// Send error notification email
			try {
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
					to: env.SMTP_FROM,
					subject: `Auto-send failed: INV-${inv.invoice_number}`,
					text: `Failed to auto-send INV-${inv.invoice_number} to ${inv.customer_name}.\n\nError: ${errorMessage}`
				});
			} catch {
				// Notification itself failed — nothing more we can do
			}
		}
	}

	return json({ status: 'ok', sent, skipped, failed });
};
