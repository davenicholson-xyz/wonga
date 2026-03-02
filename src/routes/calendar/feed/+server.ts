import { db } from '$lib/server/db';
import { timesheet, shift_pattern } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function pad(n: number): string {
	return n.toString().padStart(2, '0');
}

function formatICalDate(dateStr: string, timeStr: string, addDay: boolean = false): string {
	// dateStr is "YYYY-M-D", timeStr is "HH:MM"
	const [year, month, day] = dateStr.split('-').map(Number);
	const [hour, minute] = timeStr.split(':').map(Number);

	// Create date and add day if needed (for shifts crossing midnight)
	const date = new Date(year, month - 1, day);
	if (addDay) {
		date.setDate(date.getDate() + 1);
	}

	return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hour)}${pad(minute)}00`;
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
	const patterns = await db.select().from(shift_pattern);

	// Create a map of shift patterns by start_time-end_time key
	const patternMap = new Map(
		patterns.map((p) => [`${p.start_time}-${p.end_time}`, { icon: p.icon, color: p.color }])
	);

	const now = new Date();
	const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

	const events = shifts.map((shift) => {
		// Check if shift crosses midnight
		const needsNextDay = shift.end_time < shift.start_time;
		const dtstart = formatICalDate(shift.date, shift.start_time);
		const dtend = formatICalDate(shift.date, shift.end_time, needsNextDay);

		// Match shift pattern by time
		const patternKey = `${shift.start_time}-${shift.end_time}`;
		const pattern = patternMap.get(patternKey);
		const shiftEmoji = pattern?.icon || '';

		// Map DaisyUI colors to calendar-friendly colors
		const colorMap: Record<string, string> = {
			primary: 'royalblue',
			secondary: 'mediumpurple',
			success: 'mediumseagreen',
			error: 'tomato',
			warning: 'goldenrod',
			info: 'steelblue'
		};
		const color = pattern?.color ? colorMap[pattern.color] || 'steelblue' : 'steelblue';
		const shiftType = shift.location;

		const summary = shiftEmoji
			? `${shiftEmoji} ${escapeICalText(shift.location)}`
			: escapeICalText(shift.location);

		return [
			'BEGIN:VEVENT',
			`UID:${shift.id}@shyft`,
			`DTSTAMP:${dtstamp}`,
			`DTSTART;TZID=Europe/London:${dtstart}`,
			`DTEND;TZID=Europe/London:${dtend}`,
			`SUMMARY:${summary}`,
			`LOCATION:${escapeICalText(shift.location)}`,
			`CATEGORIES:${escapeICalText(shiftType)}`,
			`COLOR:${color}`,
			'END:VEVENT'
		].join('\r\n');
	});

	const calendar = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Shyft//Shift Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:Shyft Shifts',
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
