import { getContext, setContext } from 'svelte';

type ModalControls = {
	newCategory: { show: () => void };
	editCategory: { show: (id: string, name: string, expenses: boolean) => void };
};

const key = Symbol('budget-modals');

export function setModalControls(controls: ModalControls) {
	setContext(key, controls);
}

export function getModalControls(): ModalControls {
	return getContext(key);
}
