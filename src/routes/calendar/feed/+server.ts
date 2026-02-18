import { db } from '$lib/server/db';
import { timesheet } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

function formatICalDate(dateStr: string, timeStr: string): string {
	// dateStr is "YYYY-M-D", timeStr is "HH:MM"
	const [year, month, day] = dateStr.split('-').map(Number);
	const [hour, minute] = timeStr.split(':').map(Number);
	return `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
}

function escapeICalText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}

// VTIMEZONE for Europe/London (GMT/BST) required for DTSTART;TZID= to validate
const VTIMEZONE = [
	'BEGIN:VTIMEZONE',
	'TZID:Europe/London',
	'BEGIN:STANDARD',
	'DTSTART:19701025T020000',
	'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
	'TZOFFSETFROM:+0100',
	'TZOFFSETTO:+0000',
	'TZNAME:GMT',
	'END:STANDARD',
	'BEGIN:DAYLIGHT',
	'DTSTART:19700329T010000',
	'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
	'TZOFFSETFROM:+0000',
	'TZOFFSETTO:+0100',
	'TZNAME:BST',
	'END:DAYLIGHT',
	'END:VTIMEZONE'
].join('\r\n');

export async function GET() {
	const shifts = await db.select().from(timesheet).where(eq(timesheet.unavailable, false));

	const now = new Date();
	const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

	const events = shifts.map((shift) => {
		const dtstart = formatICalDate(shift.date, shift.start_time);
		const dtend = formatICalDate(shift.date, shift.end_time);
		const isDay = shift.start_time === '06:00';
		const shiftType = isDay ? 'Day Shift' : 'Back Shift';
		const shiftEmoji = isDay ? '☀️' : '🥱';
		const color = isDay ? 'goldenrod' : 'steelblue';

		return [
			'BEGIN:VEVENT',
			`UID:${shift.id}@wonga`,
			`DTSTAMP:${dtstamp}`,
			`DTSTART;TZID=Europe/London:${dtstart}`,
			`DTEND;TZID=Europe/London:${dtend}`,
			`SUMMARY:${shiftEmoji} ${escapeICalText(shift.location)}`,
			`LOCATION:${escapeICalText(shift.location)}`,
			`CATEGORIES:${escapeICalText(shiftType)}`,
			`COLOR:${color}`,
			'END:VEVENT'
		].join('\r\n');
	});

	const calendar = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Wonga//Shift Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:Wonga Shifts',
		'X-WR-TIMEZONE:Europe/London',
		VTIMEZONE,
		...events,
		'END:VCALENDAR'
	].join('\r\n');

	return new Response(calendar, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
}
