import { redirect } from '@sveltejs/kit';

export const load = () => {
	const this_month = new Date().getMonth() + 1;
	const this_year = new Date().getFullYear();

	redirect(307, `/income/${this_year}/${this_month}`);
};
