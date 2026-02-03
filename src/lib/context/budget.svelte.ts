import { getContext, setContext } from 'svelte';

type BudgetModalControls = {
	newCategory: { show: () => void };
	editCategory: {
		show: (id: string, name: string, emoji: string | null, expenses: boolean) => void;
	};
	newExpense: { show: (id: string) => void };
	editExpense: {
		show: (id: string, description: string, amount: number, bills_pot: boolean) => void;
	};
};

const key = Symbol('budget-modals');

export function setBudgetModalControls(controls: BudgetModalControls) {
	setContext(key, controls);
}

export function getBudgetModalControls(): BudgetModalControls {
	return getContext(key);
}
