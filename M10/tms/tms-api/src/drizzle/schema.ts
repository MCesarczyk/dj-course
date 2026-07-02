import {
  pgTable,
  integer,
  serial,
  varchar,
  decimal,
  numeric,
  boolean,
  text,
  timestamp,
  date,
  jsonb,
  index,
  foreignKey,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── vehicle_brands (marki) ──────────────────────────────────────────────────
export const vehicleBrands = pgTable('vehicle_brands', {
  id: serial('id').primaryKey().notNull(),
  name: varchar('name', { length: 80 }).notNull(),
  country: varchar('country', { length: 80 }),
}, (table) => [unique('vehicle_brands_name_key').on(table.name)]);

export type VehicleBrand = typeof vehicleBrands.$inferSelect;
export type NewVehicleBrand = typeof vehicleBrands.$inferInsert;

// ─── vehicle_models (modele) ─────────────────────────────────────────────────
// Rozróżnia ciągniki siodłowe (TRACTOR_UNIT) od naczep (SEMI_TRAILER) oraz —
// dla naczep — ich rodzaj (trailer_type: reefer/curtain/isotherm/tipper/…).
export const vehicleModels = pgTable(
  'vehicle_models',
  {
    id: serial('id').primaryKey().notNull(),
    brandId: integer('brand_id').notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    kind: varchar('kind', { length: 20 }).notNull(),
    trailerType: varchar('trailer_type', { length: 30 }),
  },
  (table) => [
    index('idx_vehicle_models_brand').on(table.brandId),
    index('idx_vehicle_models_kind').on(table.kind),
    foreignKey({
      columns: [table.brandId],
      foreignColumns: [vehicleBrands.id],
      name: 'vehicle_models_brand_id_fkey',
    }).onDelete('cascade'),
    unique('uq_vehicle_model').on(table.brandId, table.name),
    check('chk_vehicle_model_kind', sql`${table.kind} IN ('TRACTOR_UNIT', 'SEMI_TRAILER')`),
    check(
      'chk_vehicle_model_trailer_type',
      sql`(${table.kind} = 'SEMI_TRAILER' AND ${table.trailerType} IS NOT NULL) OR (${table.kind} = 'TRACTOR_UNIT' AND ${table.trailerType} IS NULL)`
    ),
  ]
);

export type VehicleModel = typeof vehicleModels.$inferSelect;
export type NewVehicleModel = typeof vehicleModels.$inferInsert;

// ─── vehicles (egzemplarze) ──────────────────────────────────────────────────
// Property names match vehicles.queries.ts (snake_case preserved intentionally).
// Rozbudowa addytywna: legacy make/model/year/fuel_tank_capacity pozostają,
// nowe pola (katalog, rejestracja, przebieg, specs jsonb) są opcjonalne.
export const vehicles = pgTable(
  'vehicles',
  {
    id: integer('id').primaryKey(),
    make: varchar('make', { length: 50 }),
    model: varchar('model', { length: 50 }).notNull(),
    year: integer('year'),
    fuel_tank_capacity: decimal('fuel_tank_capacity', { precision: 5, scale: 1 }),
    model_id: integer('model_id'),
    kind: varchar('kind', { length: 20 }),
    registration_number: varchar('registration_number', { length: 20 }),
    vin: varchar('vin', { length: 17 }),
    first_registration_date: date('first_registration_date'),
    mileage_km: integer('mileage_km'),
    status: varchar('status', { length: 20 }).default('active'),
    specs: jsonb('specs'),
  },
  (table) => [
    index('idx_vehicles_model').on(table.model_id),
    index('idx_vehicles_kind').on(table.kind),
    foreignKey({
      columns: [table.model_id],
      foreignColumns: [vehicleModels.id],
      name: 'vehicles_model_id_fkey',
    }),
    check('chk_vehicle_kind', sql`${table.kind} IS NULL OR ${table.kind} IN ('TRACTOR_UNIT', 'SEMI_TRAILER')`),
  ]
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

// ─── vehicle_documents (dokumenty egzemplarza) ───────────────────────────────
export const vehicleDocuments = pgTable(
  'vehicle_documents',
  {
    id: serial('id').primaryKey().notNull(),
    vehicleId: integer('vehicle_id').notNull(),
    docType: varchar('doc_type', { length: 40 }).notNull(),
    documentNumber: varchar('document_number', { length: 60 }),
    issueDate: date('issue_date'),
    expiryDate: date('expiry_date'),
    fileUrl: text('file_url'),
    notes: text('notes'),
  },
  (table) => [
    index('idx_vehicle_documents_vehicle').on(table.vehicleId),
    index('idx_vehicle_documents_expiry').on(table.expiryDate),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: 'vehicle_documents_vehicle_id_fkey',
    }).onDelete('cascade'),
  ]
);

export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
export type NewVehicleDocument = typeof vehicleDocuments.$inferInsert;

// ─── vehicle_history_events (krótka historia egzemplarza) ────────────────────
export const vehicleHistoryEvents = pgTable(
  'vehicle_history_events',
  {
    id: serial('id').primaryKey().notNull(),
    vehicleId: integer('vehicle_id').notNull(),
    eventType: varchar('event_type', { length: 40 }).notNull(),
    eventDate: date('event_date').notNull(),
    mileageKm: integer('mileage_km'),
    description: text('description'),
  },
  (table) => [
    index('idx_vehicle_history_vehicle').on(table.vehicleId),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: 'vehicle_history_events_vehicle_id_fkey',
    }).onDelete('cascade'),
  ]
);

export type VehicleHistoryEvent = typeof vehicleHistoryEvents.$inferSelect;
export type NewVehicleHistoryEvent = typeof vehicleHistoryEvents.$inferInsert;

// ─── drivers ─────────────────────────────────────────────────────────────────
export const drivers = pgTable('drivers', {
  id: integer('id').primaryKey().notNull(),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  email: varchar('email', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  contractType: varchar('contract_type', { length: 20 }),
  status: varchar('status', { length: 20 }),
});

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

// ─── customers ───────────────────────────────────────────────────────────────
export const customers = pgTable(
  'customers',
  {
    id: integer('id').primaryKey().notNull(),
    firstName: varchar('first_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    email: varchar('email', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    customerType: varchar('customer_type', { length: 20 }),
    address: varchar('address', { length: 255 }),
    version: integer('version').default(1).notNull(),
  },
  (table) => [
    index('idx_customers_first_name_lower_pattern').using(
      'btree',
      sql`lower((${table.firstName})::text)`
    ),
    index('idx_customers_last_name_lower_pattern').using(
      'btree',
      sql`lower((${table.lastName})::text)`
    ),
  ]
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

// ─── transportation_orders ───────────────────────────────────────────────────
export const transportationOrders = pgTable(
  'transportation_orders',
  {
    id: integer('id').primaryKey().notNull(),
    orderNumber: varchar('order_number', { length: 20 }).notNull(),
    customerId: integer('customer_id').notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    orderDate: timestamp('order_date', { mode: 'string' }).notNull(),
    expectedDelivery: date('expected_delivery'),
    shippingAddress: varchar('shipping_address', { length: 255 }),
    shippingCity: varchar('shipping_city', { length: 100 }),
    shippingState: varchar('shipping_state', { length: 50 }),
    shippingZipCode: varchar('shipping_zip_code', { length: 20 }),
    shippingMethod: varchar('shipping_method', { length: 50 }),
    trackingNumber: varchar('tracking_number', { length: 50 }),
  },
  (table) => [
    index('idx_orders_customer').using(
      'btree',
      table.customerId.asc().nullsLast().op('int4_ops')
    ),
    index('idx_orders_status').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
      name: 'transportation_orders_customer_id_fkey',
    }),
    unique('transportation_orders_order_number_key').on(table.orderNumber),
  ]
);

export type TransportationOrder = typeof transportationOrders.$inferSelect;
export type NewTransportationOrder = typeof transportationOrders.$inferInsert;

// ─── order_timeline_events ───────────────────────────────────────────────────
export const orderTimelineEvents = pgTable(
  'order_timeline_events',
  {
    id: integer('id').primaryKey().notNull(),
    orderId: integer('order_id').notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    eventTimestamp: timestamp('event_timestamp', { mode: 'string' }).notNull(),
    title: varchar('title', { length: 100 }),
    description: text('description'),
    executedBy: varchar('executed_by', { length: 100 }),
  },
  (table) => [
    index('idx_timeline_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('int4_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [transportationOrders.id],
      name: 'order_timeline_events_order_id_fkey',
    }),
  ]
);

export type OrderTimelineEvent = typeof orderTimelineEvents.$inferSelect;
export type NewOrderTimelineEvent = typeof orderTimelineEvents.$inferInsert;

// ─── order_items ─────────────────────────────────────────────────────────────
export const orderItems = pgTable(
  'order_items',
  {
    id: integer('id').primaryKey().notNull(),
    orderId: integer('order_id').notNull(),
    productName: varchar('product_name', { length: 100 }).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    itemType: varchar('item_type', { length: 20 }).notNull(),
  },
  (table) => [
    index('idx_items_order').using(
      'btree',
      table.orderId.asc().nullsLast().op('int4_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [transportationOrders.id],
      name: 'order_items_order_id_fkey',
    }),
  ]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// ─── notifications ───────────────────────────────────────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: integer('id').primaryKey().notNull(),
    userId: integer('user_id').notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
    isRead: boolean('is_read').default(false).notNull(),
  },
  (table) => [
    index('idx_notifications_created_at').using(
      'btree',
      table.createdAt.desc().nullsFirst().op('timestamp_ops')
    ),
    index('idx_notifications_user').using(
      'btree',
      table.userId.asc().nullsLast().op('int4_ops')
    ),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// ─── driver_license_types ─────────────────────────────────────────────────────
export const driverLicenseTypes = pgTable(
  'driver_license_types',
  {
    id: serial('id').primaryKey().notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
  },
  (table) => [unique('driver_license_types_code_key').on(table.code)]
);

export type DriverLicenseType = typeof driverLicenseTypes.$inferSelect;
export type NewDriverLicenseType = typeof driverLicenseTypes.$inferInsert;

// ─── driver_licenses ──────────────────────────────────────────────────────────
export const driverLicenses = pgTable(
  'driver_licenses',
  {
    id: serial('id').primaryKey().notNull(),
    driverId: integer('driver_id').notNull(),
    licenseTypeId: integer('license_type_id').notNull(),
    documentNumber: varchar('document_number', { length: 50 }),
    issueDate: date('issue_date'),
    expiryDate: date('expiry_date').notNull(),
    status: varchar('status', { length: 20 }).default('active'),
  },
  (table) => [
    index('idx_driver_licenses_expiry').using(
      'btree',
      table.expiryDate.asc().nullsLast().op('date_ops')
    ),
    foreignKey({
      columns: [table.driverId],
      foreignColumns: [drivers.id],
      name: 'driver_licenses_driver_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.licenseTypeId],
      foreignColumns: [driverLicenseTypes.id],
      name: 'driver_licenses_license_type_id_fkey',
    }),
    unique('unique_driver_license').on(table.driverId, table.licenseTypeId),
  ]
);

export type DriverLicense = typeof driverLicenses.$inferSelect;
export type NewDriverLicense = typeof driverLicenses.$inferInsert;
