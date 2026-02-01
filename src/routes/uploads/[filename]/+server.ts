import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

const mimeTypes: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp'
};

export const GET: RequestHandler = async ({ params }) => {
	const { filename } = params;
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	const contentType = mimeTypes[ext];

	if (!contentType) throw error(400, 'Unsupported file type');

	try {
		const filepath = join(process.cwd(), 'uploads', filename);
		const buffer = await readFile(filepath);

		return new Response(buffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000'
			}
		});
	} catch {
		throw error(404, 'File not found');
	}
};
