import { getContext, setContext } from 'svelte';

type InvoiceModalControls = {
	newItem: { show: () => void };
	editItem: {
		show: (id: string, name: string, description: string, price: number, quantity: number) => void;
	};
};

const key = Symbol('invoice-modals');

export function setInvoiceModalControls(controls: InvoiceModalControls) {
	setContext(key, controls);
}

export function getInvoiceModalControls(): InvoiceModalControls {
	return getContext(key);
}
