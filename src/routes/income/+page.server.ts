import { redirect } from '@sveltejs/kit';

const this_month = (new Date().getMonth() + 1) as number;
const this_year = parseInt(new Date().getFullYear().toString());

redirect(307, `/income/${this_year}/${this_month}`);
