/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Supported pallet types */
export type PalletType = "epal1" | "industrial" | "half" | "cp1" | "cp3" | "h1";

/** Type of cargo being transported */
export type CargoType = "FOOD" | "CHEMICAL" | "ELECTRONICS" | "ADR" | "GENERAL";

/** Shape of the carrier: MONOLITHIC (single self-contained vehicle body) or MODULAR (a towed semi-trailer that requires a tractor unit). */
export type VehicleClass = "MONOLITHIC" | "MODULAR";

/** Current status of the load plan */
export type CargoLoadPlanStatus = "DRAFT" | "FINALIZED";

/**
 * Unit of weight measurement
 * @default "KG"
 */
export type WeightUnit = "KG" | "TONNE" | "LB";

/** Supported load-carrier types. MODULAR carriers are semi-trailers (need a separate tractor unit); MONOLITHIC carriers are self-contained rigid vehicle bodies. These are generic loadable-space categories — concrete brand-models live in the vehicles catalog. */
export type CarrierType =
  | "standard-curtainside"
  | "mega"
  | "reefer"
  | "van"
  | "box-truck";

/** Rodzaj pojazdu. Modularne: TRACTOR_UNIT (ciągnik siodłowy) + SEMI_TRAILER (naczepa). Monolityczne (samodzielne): VAN (furgon) + BOX_TRUCK (ciężarówka ze stałą zabudową). */
export type VehicleKind = "TRACTOR_UNIT" | "SEMI_TRAILER" | "VAN" | "BOX_TRUCK";

/** Pagination metadata attached to list responses. */
export interface Pagination {
  /**
   * Current page number (1-based)
   * @example 1
   */
  page: number;
  /**
   * Number of items per page
   * @example 20
   */
  limit: number;
  /**
   * Total number of records across all pages
   * @example 50
   */
  total: number;
  /**
   * Total number of pages
   * @example 3
   */
  totalPages: number;
}

/** Standard error envelope returned on 4xx / 5xx responses. */
export interface ErrorResponse {
  /**
   * Human-readable error message.
   * @example "Vehicle not found"
   */
  error: string;
}

/** A single customer record as returned in list responses. */
export interface CustomerListItem {
  /**
   * Unique customer identifier
   * @example 1
   */
  id: number;
  /**
   * Customer first name
   * @maxLength 50
   * @example "Maida"
   */
  first_name?: string | null;
  /**
   * Customer last name
   * @maxLength 50
   * @example "Dach"
   */
  last_name?: string | null;
  /**
   * Customer email address
   * @maxLength 100
   * @example "forestraynor@bauch.io"
   */
  email?: string | null;
  /**
   * Customer phone number
   * @maxLength 20
   * @example "8082482608"
   */
  phone?: string | null;
  /**
   * Customer classification (e.g. BUSINESS, INDIVIDUAL)
   * @maxLength 20
   * @example "BUSINESS"
   */
  customer_type?: string | null;
  /** Hypermedia links for related resources */
  _links?: {
    /**
     * URL to fetch transportation orders for this customer
     * @example "http://localhost:3000/transportation-orders?customer_id=1"
     */
    orders?: string;
  };
}

/** Paginated list of customers. */
export interface CustomerListResponse {
  data: CustomerListItem[];
  /** Pagination metadata attached to list responses. */
  pagination: Pagination;
}

/** Brief summary of a transportation order linked to a customer. */
export interface CustomerOrderSummary {
  /**
   * Order identifier
   * @example 472
   */
  id: number;
  /**
   * Human-readable order number
   * @example "#00472"
   */
  order_number: string;
  /**
   * Order total amount
   * @format float
   * @example 43.19
   */
  amount: number;
  /**
   * Current order status
   * @example "DELIVERED"
   */
  status: string;
}

/** Full customer record including all fields and associated orders summary. */
export interface CustomerDetail {
  /**
   * Unique customer identifier
   * @example 1
   */
  id: number;
  /**
   * Customer first name
   * @maxLength 50
   * @example "Maida"
   */
  first_name?: string | null;
  /**
   * Customer last name
   * @maxLength 50
   * @example "Dach"
   */
  last_name?: string | null;
  /**
   * Customer email address
   * @maxLength 100
   * @example "forestraynor@bauch.io"
   */
  email?: string | null;
  /**
   * Customer phone number
   * @maxLength 20
   * @example "8082482608"
   */
  phone?: string | null;
  /**
   * Customer classification (e.g. BUSINESS, INDIVIDUAL)
   * @maxLength 20
   * @example "BUSINESS"
   */
  customer_type?: string | null;
  /**
   * Customer address
   * @maxLength 255
   * @example "75968 Villageshire, St. Louis, New Hampshire 86673"
   */
  address?: string | null;
  /**
   * Optimistic locking version counter – must be passed in PATCH requests
   * @example 1
   */
  version: number;
  /** Summary of transportation orders associated with this customer */
  orders: CustomerOrderSummary[];
}

/** Payload for partially updating a customer's name. `version` (optimistic lock) is required. At least one of `first_name` or `last_name` must be provided. */
export interface CustomerPatchInput {
  /**
   * Current version of the customer record (used for optimistic locking)
   * @min 1
   * @example 1
   */
  version: number;
  /**
   * New first name (optional – provide to update)
   * @maxLength 50
   * @example "Maida"
   */
  first_name?: string;
  /**
   * New last name (optional – provide to update)
   * @maxLength 50
   * @example "Dach"
   */
  last_name?: string;
}

/** Updated customer data returned after a successful PATCH. */
export interface CustomerPatchResponse {
  /**
   * Unique customer identifier
   * @example 1
   */
  id: number;
  /**
   * Updated first name
   * @example "Maida Updated"
   */
  first_name?: string | null;
  /**
   * Updated last name
   * @example "Dach"
   */
  last_name?: string | null;
  /**
   * Incremented version number after the update
   * @example 2
   */
  version: number;
}

/** A single vehicle record as returned by the API. */
export interface Vehicle {
  /**
   * Unique vehicle identifier
   * @example 1
   */
  id: number;
  /**
   * Vehicle manufacturer / brand
   * @maxLength 50
   * @example "Suzuki"
   */
  make?: string | null;
  /**
   * Vehicle model name
   * @maxLength 50
   * @example "S4"
   */
  model: string;
  /**
   * Manufacturing year
   * @example 2021
   */
  year?: number | null;
  /**
   * Fuel tank capacity in litres. Returned as a decimal string (e.g. "51.1") because Postgres numeric/decimal is serialised as a string by the pg driver.
   * @example "51.1"
   */
  fuel_tank_capacity?: string | null;
  /**
   * Reference to a catalog model (vehicle_models.id)
   * @example 3
   */
  model_id?: number | null;
  /** Rozróżnienie ciągnik siodłowy / naczepa (zdenormalizowane pod filtr) */
  kind?: "TRACTOR_UNIT" | "SEMI_TRAILER" | "VAN" | "BOX_TRUCK" | null;
  /**
   * Numer rejestracyjny
   * @maxLength 20
   * @example "WA 12345"
   */
  registration_number?: string | null;
  /**
   * Numer VIN
   * @maxLength 17
   * @example "YV2RT40A8FB123456"
   */
  vin?: string | null;
  /**
   * Data pierwszej rejestracji
   * @format date
   * @example "2021-03-15"
   */
  first_registration_date?: string | null;
  /**
   * Przebieg w kilometrach
   * @example 145000
   */
  mileage_km?: number | null;
  /**
   * Status egzemplarza
   * @maxLength 20
   * @example "active"
   */
  status?: string | null;
  /**
   * Techniczne atrybuty zależne od typu (JSONB).
   * Ciągnik: {power_kw, euro_norm, axles, fuel_type};
   * naczepa: {euro_pallets, volume_m3, interior_height_m, has_tail_lift, has_refrigeration}.
   * @example {"power_kw":331,"euro_norm":"EURO6","axles":2}
   */
  specs?: Record<string, any>;
}

/** Paginated list of vehicles. */
export interface VehicleListResponse {
  data: Vehicle[];
  /** Pagination metadata attached to list responses. */
  pagination: Pagination;
}

/** Payload for creating a new vehicle instance (egzemplarz). All fields are optional — use legacy make/model or link a catalog model via model_id. */
export interface VehicleCreateInput {
  /**
   * @maxLength 50
   * @example "Volvo"
   */
  make?: string | null;
  /**
   * @maxLength 50
   * @example "FH 500"
   */
  model?: string | null;
  /** @example 2024 */
  year?: number | null;
  /**
   * @format float
   * @min 0
   * @exclusiveMin true
   * @example 600
   */
  fuel_tank_capacity?: number | null;
  /** @example 3 */
  model_id?: number | null;
  kind?: "TRACTOR_UNIT" | "SEMI_TRAILER" | "VAN" | "BOX_TRUCK" | null;
  /**
   * @maxLength 20
   * @example "WA 12345"
   */
  registration_number?: string | null;
  /**
   * @maxLength 17
   * @example "YV2RT40A8FB123456"
   */
  vin?: string | null;
  /**
   * @format date
   * @example "2021-03-15"
   */
  first_registration_date?: string | null;
  /**
   * @min 0
   * @example 145000
   */
  mileage_km?: number | null;
  /**
   * @maxLength 20
   * @example "active"
   */
  status?: string | null;
  /** @example {"power_kw":331,"euro_norm":"EURO6","axles":2} */
  specs?: Record<string, any>;
}

/** A vehicle model (model pojazdu). */
export interface VehicleModel {
  /** @example 1 */
  id: number;
  /** @example 1 */
  brandId: number;
  /**
   * @maxLength 120
   * @example "Scania R450"
   */
  name: string;
  /** Rodzaj pojazdu. Modularne: TRACTOR_UNIT (ciągnik siodłowy) + SEMI_TRAILER (naczepa). Monolityczne (samodzielne): VAN (furgon) + BOX_TRUCK (ciężarówka ze stałą zabudową). */
  kind: VehicleKind;
  /** Wymagane dla SEMI_TRAILER, puste dla TRACTOR_UNIT. */
  trailerType?:
    | "reefer"
    | "curtain"
    | "isotherm"
    | "tipper"
    | "platform"
    | "tank"
    | "container"
    | null;
}

/** A vehicle brand (marka). */
export interface VehicleBrand {
  /** @example 1 */
  id: number;
  /**
   * @maxLength 80
   * @example "Volvo"
   */
  name: string;
  /**
   * @maxLength 80
   * @example "Sweden"
   */
  country?: string | null;
}

/** A document (dokument) attached to a vehicle. */
export interface VehicleDocument {
  /** @example 1 */
  id: number;
  /** @example 3 */
  vehicle_id: number;
  /**
   * registration_certificate | insurance_oc | insurance_ac | technical_inspection | tachograph | atp_certificate | other
   * @example "insurance_oc"
   */
  doc_type: string;
  /**
   * @maxLength 60
   * @example "OC/2026/12345"
   */
  document_number?: string | null;
  /**
   * @format date
   * @example "2026-01-01"
   */
  issue_date?: string | null;
  /**
   * @format date
   * @example "2026-12-31"
   */
  expiry_date?: string | null;
  file_url?: string | null;
  notes?: string | null;
}

/** A single history event (zdarzenie historii) of a vehicle. */
export interface VehicleHistoryEvent {
  /** @example 1 */
  id: number;
  /** @example 3 */
  vehicle_id: number;
  /**
   * purchase | inspection | repair | accident | mileage_reading | status_change | sold
   * @example "inspection"
   */
  event_type: string;
  /**
   * @format date
   * @example "2026-05-10"
   */
  event_date: string;
  /** @example 145000 */
  mileage_km?: number | null;
  /** @example "Badanie techniczne — wynik pozytywny" */
  description?: string | null;
}

/** A vehicle instance with its catalog (model + brand) and nested documents and history. Returned by GET /vehicles/{id}. */
export type VehicleDetail = Vehicle & {
  /** A vehicle model (model pojazdu). */
  model?: VehicleModel;
  /** A vehicle brand (marka). */
  brand?: VehicleBrand;
  documents?: VehicleDocument[];
  history?: VehicleHistoryEvent[];
};

/** Payload for updating an existing vehicle. All fields are optional (partial update). Provide only the fields you want to change. */
export type VehicleUpdateInput = VehicleCreateInput;

export interface VehicleDocumentListResponse {
  data: VehicleDocument[];
}

export interface VehicleDocumentCreateInput {
  /** @example "insurance_oc" */
  doc_type:
    | "registration_certificate"
    | "insurance_oc"
    | "insurance_ac"
    | "technical_inspection"
    | "tachograph"
    | "atp_certificate"
    | "other";
  /** @maxLength 60 */
  document_number?: string | null;
  /** @format date */
  issue_date?: string | null;
  /** @format date */
  expiry_date?: string | null;
  file_url?: string | null;
  notes?: string | null;
}

export interface VehicleHistoryListResponse {
  data: VehicleHistoryEvent[];
}

export interface VehicleHistoryEventCreateInput {
  /** @example "inspection" */
  event_type:
    | "purchase"
    | "inspection"
    | "repair"
    | "accident"
    | "mileage_reading"
    | "status_change"
    | "sold";
  /**
   * @format date
   * @example "2026-05-10"
   */
  event_date: string;
  /**
   * @min 0
   * @example 145000
   */
  mileage_km?: number | null;
  description?: string | null;
}

export interface VehicleBrandListResponse {
  data: VehicleBrand[];
  /** Pagination metadata attached to list responses. */
  pagination: Pagination;
}

export interface VehicleBrandCreateInput {
  /**
   * @minLength 1
   * @maxLength 80
   * @example "Scania"
   */
  name: string;
  /**
   * @maxLength 80
   * @example "Sweden"
   */
  country?: string | null;
}

/** Partial update — only provided fields are changed. */
export interface VehicleBrandUpdateInput {
  /**
   * @minLength 1
   * @maxLength 80
   */
  name?: string;
  /** @maxLength 80 */
  country?: string | null;
}

export interface VehicleModelListResponse {
  data: VehicleModel[];
  /** Pagination metadata attached to list responses. */
  pagination: Pagination;
}

export interface VehicleModelCreateInput {
  /** @example 1 */
  brandId: number;
  /**
   * @minLength 1
   * @maxLength 120
   * @example "Volvo FH 500"
   */
  name: string;
  /** Rodzaj pojazdu. Modularne: TRACTOR_UNIT (ciągnik siodłowy) + SEMI_TRAILER (naczepa). Monolityczne (samodzielne): VAN (furgon) + BOX_TRUCK (ciężarówka ze stałą zabudową). */
  kind: VehicleKind;
  trailerType?:
    | "reefer"
    | "curtain"
    | "isotherm"
    | "tipper"
    | "platform"
    | "tank"
    | "container"
    | null;
}

/** Partial update — only provided fields are changed. */
export interface VehicleModelUpdateInput {
  brandId?: number;
  /**
   * @minLength 1
   * @maxLength 120
   */
  name?: string;
  /** Rodzaj pojazdu. Modularne: TRACTOR_UNIT (ciągnik siodłowy) + SEMI_TRAILER (naczepa). Monolityczne (samodzielne): VAN (furgon) + BOX_TRUCK (ciężarówka ze stałą zabudową). */
  kind?: VehicleKind;
  trailerType?:
    | "reefer"
    | "curtain"
    | "isotherm"
    | "tipper"
    | "platform"
    | "tank"
    | "container"
    | null;
}

/** A single driver record as returned in list and create responses. */
export interface DriverListItem {
  /**
   * Unique driver identifier
   * @example 1
   */
  id: number;
  /**
   * Driver first name
   * @maxLength 50
   * @example "Matt"
   */
  first_name?: string | null;
  /**
   * Driver last name
   * @maxLength 50
   * @example "Jerde"
   */
  last_name?: string | null;
  /**
   * Driver email address
   * @maxLength 100
   * @example "celiawalker@swift.net"
   */
  email?: string | null;
  /**
   * Driver phone number
   * @maxLength 20
   * @example "4111234962"
   */
  phone?: string | null;
  /**
   * Contract type (e.g. CONTRACTOR, FULL_TIME)
   * @maxLength 20
   * @example "CONTRACTOR"
   */
  contract_type?: string | null;
  /**
   * Driver status (e.g. ON_ROUTE, ACTIVE, RESTING)
   * @maxLength 20
   * @example "ON_ROUTE"
   */
  status?: string | null;
}

/** Payload for creating a new driver. All fields are optional. */
export interface DriverCreateInput {
  /**
   * Driver first name
   * @maxLength 50
   * @example "Jan"
   */
  first_name?: string | null;
  /**
   * Driver last name
   * @maxLength 50
   * @example "Kowalski"
   */
  last_name?: string | null;
  /**
   * Driver email address
   * @maxLength 100
   * @example "jan.kowalski@example.com"
   */
  email?: string | null;
  /**
   * Driver phone number
   * @maxLength 20
   * @example "1234567890"
   */
  phone?: string | null;
  /**
   * Contract type (e.g. FULL_TIME, CONTRACTOR)
   * @maxLength 20
   * @example "FULL_TIME"
   */
  contract_type?: string | null;
  /**
   * Driver status
   * @maxLength 20
   * @example "ACTIVE"
   */
  status?: string | null;
}

/** Driver license record with license type details (returned in driver detail). */
export interface DriverLicense {
  /**
   * License record identifier
   * @example 1
   */
  id?: number;
  /**
   * License document number
   * @example "CXX232105"
   */
  document_number?: string | null;
  /**
   * License issue date (YYYY-MM-DD)
   * @format date
   * @example "2020-08-30"
   */
  issue_date?: string | null;
  /**
   * License expiry date (YYYY-MM-DD)
   * @format date
   * @example "2027-09-21"
   */
  expiry_date?: string | null;
  /**
   * License status (e.g. active)
   * @example "active"
   */
  status?: string | null;
  /**
   * License type code
   * @example "C"
   */
  code?: string | null;
  /**
   * License type name
   * @example "Prawo jazdy kat. C"
   */
  name?: string | null;
  /**
   * License type description
   * @example "Pojazdy ciężarowe powyżej 3,5t"
   */
  description?: string | null;
}

/** Full driver record including associated licenses (returned by GET /drivers/{id}). */
export interface DriverDetail {
  /**
   * Unique driver identifier
   * @example 1
   */
  id: number;
  /**
   * Driver first name
   * @maxLength 50
   * @example "Matt"
   */
  first_name?: string | null;
  /**
   * Driver last name
   * @maxLength 50
   * @example "Jerde"
   */
  last_name?: string | null;
  /**
   * Driver email address
   * @maxLength 100
   * @example "celiawalker@swift.net"
   */
  email?: string | null;
  /**
   * Driver phone number
   * @maxLength 20
   * @example "4111234962"
   */
  phone?: string | null;
  /**
   * Contract type (e.g. CONTRACTOR, FULL_TIME)
   * @maxLength 20
   * @example "CONTRACTOR"
   */
  contract_type?: string | null;
  /**
   * Driver status
   * @maxLength 20
   * @example "ON_ROUTE"
   */
  status?: string | null;
  /** Associated driver licenses with type details */
  licenses: DriverLicense[];
}

/** A single transportation order as returned by the API. */
export interface TransportationOrder {
  /**
   * Unique order identifier
   * @example 472
   */
  id: number;
  /**
   * Human-readable order number (e.g.
   * @maxLength 20
   * @example "#00472"
   */
  order_number: string;
  /**
   * ID of the customer who placed the order
   * @example 1
   */
  customer_id: number;
  /**
   * ID of the driver assigned to this order. Null when no driver has been assigned yet.
   * @example 7
   */
  driver_id?: number | null;
  /**
   * Order status (e.g. DELIVERED, PENDING)
   * @maxLength 20
   * @example "DELIVERED"
   */
  status: string;
  /**
   * Order total amount. Returned as a decimal string (e.g. "43.19") because Postgres numeric is serialised as a string by the pg driver.
   * @example "43.19"
   */
  amount: string;
  /**
   * When the order was placed (ISO 8601)
   * @format date-time
   * @example "2025-11-25T22:31:47.000Z"
   */
  order_date: string;
  /**
   * Expected delivery date (ISO 8601; Postgres date may be serialised with time component)
   * @format date-time
   * @example "2025-12-02T00:00:00.000Z"
   */
  expected_delivery?: string | null;
  /**
   * Delivery street address
   * @maxLength 255
   * @example "6806 East Landchester, Plano, Utah 10652"
   */
  shipping_address?: string | null;
  /**
   * Delivery city
   * @maxLength 100
   * @example "Plano"
   */
  shipping_city?: string | null;
  /**
   * Delivery state or region
   * @maxLength 50
   * @example "Utah"
   */
  shipping_state?: string | null;
  /**
   * Delivery postal code
   * @maxLength 20
   * @example "10652"
   */
  shipping_zip_code?: string | null;
  /**
   * Shipping method name
   * @maxLength 50
   * @example "Standard Delivery"
   */
  shipping_method?: string | null;
  /**
   * Carrier tracking number
   * @maxLength 50
   * @example "SR0472"
   */
  tracking_number?: string | null;
}

/** Payload for assigning a driver to a transportation order. */
export interface AssignDriverInput {
  /**
   * ID of the driver to assign to the order.
   * @example 7
   */
  driver_id: number;
}

/** A single notification as returned by the API. */
export interface Notification {
  /**
   * Unique notification identifier
   * @example 115
   */
  id: number;
  /**
   * ID of the user who receives the notification
   * @example 1
   */
  user_id: number;
  /**
   * Notification type (e.g. warning, success)
   * @maxLength 20
   * @example "warning"
   */
  type: string;
  /**
   * Notification message content
   * @example "Low fuel alert for assigned truck"
   */
  message: string;
  /**
   * When the notification was created (ISO 8601)
   * @format date-time
   * @example "2026-03-13T19:10:40.000Z"
   */
  created_at: string;
  /**
   * Whether the notification has been read
   * @example false
   */
  is_read: boolean;
}

/** Paginated list of notifications. */
export interface NotificationListResponse {
  data: Notification[];
  /** Pagination metadata attached to list responses. */
  pagination: Pagination;
}

/** Payload for creating a new load plan. */
export interface CreateLoadPlanInput {
  /** Supported load-carrier types. MODULAR carriers are semi-trailers (need a separate tractor unit); MONOLITHIC carriers are self-contained rigid vehicle bodies. These are generic loadable-space categories — concrete brand-models live in the vehicles catalog. */
  carrierType: CarrierType;
}

/** Identifier of the newly created load plan. */
export interface CreateLoadPlanResponse {
  /**
   * UUID of the created load plan
   * @format uuid
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  id: string;
}

/** Details of the load carrier assigned to the load plan. */
export interface CarrierReadModel {
  /** Supported load-carrier types. MODULAR carriers are semi-trailers (need a separate tractor unit); MONOLITHIC carriers are self-contained rigid vehicle bodies. These are generic loadable-space categories — concrete brand-models live in the vehicles catalog. */
  type: CarrierType;
  /** Shape of the carrier: MONOLITHIC (single self-contained vehicle body) or MODULAR (a towed semi-trailer that requires a tractor unit). */
  vehicleClass: VehicleClass;
  /**
   * True when the carrier is MODULAR (a semi-trailer) and therefore needs a separate tractor unit to be moved. This module does not reserve the tractor; the flag signals the requirement to downstream fleet/dispatch.
   * @example true
   */
  requiresTractor: boolean;
  /** @example true */
  canCarryPallets: boolean;
  /**
   * Maximum weight capacity in kilograms
   * @example 24000
   */
  maxWeightCapacityKg: number;
  /**
   * Internal loading-space width in millimetres
   * @example 2480
   */
  widthMm: number;
  /**
   * Internal loading-space height in millimetres
   * @example 2700
   */
  heightMm: number;
  /**
   * Maximum loading metres (LDM). For sub-2.4 m bodies (vans) this is an approximation.
   * @example 13.6
   */
  maxLdm: number;
}

/** A single pallet unit assigned to a load plan. */
export interface PalletUnitReadModel {
  /**
   * Unique identifier of the pallet unit
   * @format uuid
   * @example "b2c3d4e5-f6a7-8901-bcde-f12345678901"
   */
  id: string;
  /**
   * Human-readable label of the pallet spec (e.g. "EPAL 1")
   * @example "EPAL 1"
   */
  palletLabel: string;
  /** Type of cargo being transported */
  cargoType: CargoType;
  /**
   * Weight of the cargo on this pallet, expressed in the unit specified by the weightUnit field on the parent CargoLoadPlanReadModel
   * @min 0
   * @exclusiveMin true
   * @example 600
   */
  weight: number;
  /**
   * Total height of pallet + cargo in millimetres
   * @min 0
   * @exclusiveMin true
   * @example 1400
   */
  totalHeightMm: number;
  /** Human-readable product description (e.g. "FOOD – warzywa") */
  description?: string | null;
}

/** Full state of a cargo load plan. */
export interface CargoLoadPlanReadModel {
  /**
   * Unique identifier of the load plan
   * @format uuid
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  id: string;
  /** Current status of the load plan */
  status: CargoLoadPlanStatus;
  /**
   * Optimistic concurrency version of the load plan
   * @min 0
   * @example 3
   */
  version: number;
  /** Unit of weight measurement */
  weightUnit: WeightUnit;
  /** Details of the load carrier assigned to the load plan. */
  carrier: CarrierReadModel;
  /**
   * Currently used loading metres
   * @min 0
   * @example 2.4
   */
  currentLdm: number;
  /**
   * Total weight of all assigned cargo units, expressed in the unit given by weightUnit
   * @min 0
   * @example 600
   */
  plannedWeight: number;
  /** Cargo units assigned to this plan */
  units: PalletUnitReadModel[];
}

/** Payload for adding a cargo unit to a load plan. */
export interface AddCargoInput {
  /** Supported pallet types */
  palletType: PalletType;
  /** Type of cargo being transported */
  cargoType: CargoType;
  /**
   * Weight of the cargo in kilograms
   * @min 0
   * @exclusiveMin true
   * @example 600
   */
  weightKg: number;
  /**
   * Height of the cargo (without pallet) in millimetres
   * @min 0
   * @exclusiveMin true
   * @example 1200
   */
  cargoHeightMm: number;
}

/** Payload for changing the carrier type on a load plan. */
export interface ChangeCarrierInput {
  /** Supported load-carrier types. MODULAR carriers are semi-trailers (need a separate tractor unit); MONOLITHIC carriers are self-contained rigid vehicle bodies. These are generic loadable-space categories — concrete brand-models live in the vehicles catalog. */
  carrierType: CarrierType;
}

/** Health check response body. */
export interface HealthResponse {
  /**
   * Health status (always "ok" when the service is running)
   * @example "ok"
   */
  status: string;
  /**
   * Service name (from SERVICE_NAME env or default tms-api)
   * @example "tms-api"
   */
  service: string;
}
