import { db } from '$lib/server/db';
import { invoice } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const invoiceNumber = parseInt(params.number);

	const results = await db
		.select({ id: invoice.id, timesheet_image: invoice.timesheet_image })
		.from(invoice)
		.where(eq(invoice.invoice_number, invoiceNumber));

	const inv = results[0];
	if (!inv) throw error(404, 'Invoice not found');
	if (!inv.timesheet_image) throw error(400, 'No timesheet image to rotate');

	const uploadsDir = join(process.cwd(), 'uploads');
	const imagePath = join(uploadsDir, inv.timesheet_image);

	try {
		// Read the existing image
		const buffer = await readFile(imagePath);

		// Rotate 90 degrees clockwise
		const rotatedBuffer = await sharp(buffer).rotate(90).toBuffer();

		// Overwrite the file with rotated version
		await writeFile(imagePath, rotatedBuffer);

		return json({ success: true });
	} catch (err) {
		console.error('Error rotating image:', err);
		throw error(500, 'Failed to rotate image');
	}
};
