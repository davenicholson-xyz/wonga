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
	paid: integer('paid').notNull().default(0),
	emailed: integer('emailed').notNull().default(0),
	timesheet_image: text('timesheet_image')
});

export const income = sqliteTable('income', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	invoice_number: integer('invoice_number').notNull(),
	due_date: integer('due_date', { mode: 'timestamp' }).notNull(),
	amount: integer('amount').notNull()
});

export const settings = sqliteTable('settings', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	key: text('key').notNull().unique(),
	value: text('value').notNull()
});

export const category = sqliteTable('category', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	emoji: text('emoji')
});

export const expense = sqliteTable('expense', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	category_id: text('category_id').references(() => category.id),
	description: text('description').notNull(),
	amount: integer('amount').notNull(),
	billspot: integer({ mode: 'boolean' }).default(false)
});

export const timesheet = sqliteTable('timesheet', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	location: text('location').notNull(),
	date: text('date').notNull().unique(),
	start_time: text('start_time').notNull(),
	end_time: text('end_time').notNull(),
	unavailable: integer('unavailable', { mode: 'boolean' }).default(false)
});

export const shift_pattern = sqliteTable('shift_pattern', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	start_time: text('start_time').notNull(),
	end_time: text('end_time').notNull(),
	color: text('color').notNull().default('primary'), // DaisyUI token: primary|secondary|success|error|warning|info
	icon: text('icon'), // optional emoji/character
	sort_order: integer('sort_order').notNull().default(0)
});
