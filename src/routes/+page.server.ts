import { redirect } from '@sveltejs/kit';

export function load() {
	const now = new Date();
	redirect(307, `/timesheet/${now.getFullYear()}/${now.getMonth() + 1}`);
}
