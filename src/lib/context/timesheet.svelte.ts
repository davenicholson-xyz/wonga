import { getContext, setContext } from 'svelte';

type Entry = { id: string; date: string; location: string; start_time: string; end_time: string };

type TimeSheetModalControls = {
	newEntry: { show: (date: string, entry?: Entry) => void };
};

const key = Symbol('timesheet-modals');

export function setTimeSheetModalControls(controls: TimeSheetModalControls) {
	setContext(key, controls);
}

export function getTimeSheetModalControls(): TimeSheetModalControls {
	return getContext(key);
}
