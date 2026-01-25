import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const customer = sqliteTable('customer', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	address: text('address').notNull(),
	email: text('email').notNull()
});

export const invoice = sqliteTable('invoice', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	invoice_number: integer('invoice_number').notNull(),
	customer_id: text('customer_id').references(() => customer.id),
	invoice_date: integer('invoice_date', { mode: 'timestamp' }).notNull(),
	due_date: integer('due_date', { mode: 'timestamp' }).notNull(),
	items: text('items').notNull(),
	total: integer('total').notNull(),
	paid: integer('paid').notNull().default(0)
});

export const income = sqliteTable('income', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	invoice_number: integer('invoice_number').notNull(),
	due_date: integer('due_date', { mode: 'timestamp' }).notNull(),
	amount: integer('amount').notNull()
});
