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
	customer_id: text('customer_id').notNull(),
	invoice_date: integer('invoice_date', { mode: 'timestamp' }).notNull(),
	due_date: integer('invoice_date', { mode: 'timestamp' }).notNull()
});
