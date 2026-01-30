import { getContext, setContext } from 'svelte';

export type Entry = {
	id: string;
	date: string;
	location: string;
	start_time: string;
	end_time: string;
};

type Day = { date: string; dayOfWeek: number; entry?: Entry };

type TimeSheetModalControls = {
	newEntry: { show: (date: string, entry?: Entry) => void };
	weekView: { show: (days: Day[], weekNumber: number) => void };
};

const key = Symbol('timesheet-modals');

export function setTimeSheetModalControls(controls: TimeSheetModalControls) {
	setContext(key, controls);
}

export function getTimeSheetModalControls(): TimeSheetModalControls {
	return getContext(key);
}
