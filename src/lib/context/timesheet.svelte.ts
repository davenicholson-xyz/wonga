import { getContext, setContext } from 'svelte';

type TimeSheetModalControls = {
	newCategory: { show: () => void };
};

const key = Symbol('timesheet-modals');

export function setTimeSheetModalControls(controls: TimeSheetModalControls) {
	setContext(key, controls);
}

export function getTimeSheetModalControls(): TimeSheetModalControls {
	return getContext(key);
}
