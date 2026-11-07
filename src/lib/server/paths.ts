import { resolve } from 'path';
import { env } from '$env/dynamic/private';

/**
 * Where uploaded timesheet images live.
 * Set UPLOADS_DIR in production (e.g. /var/lib/wonga/uploads); defaults to ./uploads for dev.
 */
export function uploadsDir(): string {
	return resolve(env.UPLOADS_DIR || 'uploads');
}
