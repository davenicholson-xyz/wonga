import { db } from '$lib/server/db';
import { invoice, settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const invoiceNumber = parseInt(params.number);

	const results = await db
		.select({ id: invoice.id })
		.from(invoice)
		.where(eq(invoice.invoice_number, invoiceNumber));

	const inv = results[0];
	if (!inv) throw error(404, 'Invoice not found');

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file || !file.size) throw error(400, 'No file provided');

	const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
	const allowed = ['jpg', 'jpeg', 'png', 'webp'];
	if (!allowed.includes(ext)) throw error(400, 'Invalid file type. Allowed: jpg, png, webp');

	const filename = `inv-${invoiceNumber}-timesheet.${ext}`;
	const uploadsDir = join(process.cwd(), 'uploads');

	await mkdir(uploadsDir, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());

	// Get image size setting
	const sizeRow = await db.select().from(settings).where(eq(settings.key, 'image_size')).execute();
	const sizeSetting = (sizeRow[0]?.value as 'small' | 'medium' | 'large') || 'medium';
	const maxDimensions: Record<string, number> = { small: 800, medium: 1200, large: 1600 };
	const maxDim = maxDimensions[sizeSetting];

	// Resize image
	const resizedBuffer = await sharp(buffer)
		.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
		.toBuffer();

	await writeFile(join(uploadsDir, filename), resizedBuffer);

	await db.update(invoice).set({ timesheet_image: filename }).where(eq(invoice.id, inv.id));

	return json({ filename });
};
