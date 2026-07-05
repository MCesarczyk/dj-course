package cargo_plans

// CarrierType represents a carrier registry key stored in DB.
type CarrierType string

const (
	// MODULAR carriers (semi-trailers – need a tractor unit)
	StandardCurtainside CarrierType = "standard-curtainside"
	Mega                CarrierType = "mega"
	Reefer              CarrierType = "reefer"
	// MONOLITHIC carriers (self-contained rigid vehicle bodies – no tractor)
	Van      CarrierType = "van"
	BoxTruck CarrierType = "box-truck"
)

// PalletType represents a pallet spec registry key stored in DB.
type PalletType string

const (
	Epal1      PalletType = "epal1"
	Industrial PalletType = "industrial"
	Half       PalletType = "half"
	CP1        PalletType = "cp1"
	CP3        PalletType = "cp3"
	H1         PalletType = "h1"
)

// CargoType mirrors the domain enum value stored in DB.
type CargoType string

const (
	Food           CargoType = "FOOD"
	Chemical       CargoType = "CHEMICAL"
	Electronics    CargoType = "ELECTRONICS"
	DangerousGoods CargoType = "ADR"
	General        CargoType = "GENERAL"
)

// Status of a cargo load plan.
type Status string

const (
	Draft     Status = "DRAFT"
	Finalized Status = "FINALIZED"
)

// carrierSpec holds static configuration for each carrier type.
// Aligned with tms-api CarrierFactory capabilities.
type carrierSpec struct {
	Type                CarrierType
	HasClimateControl   bool
	SupportsSideLoading bool
	HasHighSecurityLock bool
	IsBulkReady         bool
}

// palletSpec holds static configuration for each pallet type.
type palletSpec struct {
	Type         PalletType
	AllowedCargo []CargoType
	// LDM contribution per unit on a standard carrier (simplified)
	LdmPerUnit   float64
	MaxWeightKg  float64
	BaseHeightMm int
}

var carrierSpecs = []carrierSpec{
	{StandardCurtainside, false, true, false, false},
	{Mega, false, true, false, false},
	{Reefer, true, false, true, false},
	// MONOLITHIC – dry freight, no special capabilities. Available for future seeds;
	// carrierForCargo currently only picks the first three (semi-trailers).
	{Van, false, false, false, false},
	{BoxTruck, false, false, false, false},
}

var palletSpecs = []palletSpec{
	{Epal1, []CargoType{General, Food, Electronics}, 0.40, 4000, 144},
	{Industrial, []CargoType{General, Electronics}, 0.50, 1500, 162},
	{Half, []CargoType{General, Food}, 0.27, 750, 144},
	{CP1, []CargoType{Chemical, DangerousGoods}, 0.50, 1190, 138},
	{CP3, []CargoType{Chemical, DangerousGoods}, 0.48, 1200, 138},
	{H1, []CargoType{Food}, 0.40, 5000, 160},
}

// PredefinedPlan holds static configuration for seeded plans used in .http test scenarios.
type PredefinedPlan struct {
	ID          string
	CargoType   CargoType
	CarrierType CarrierType
	Status      Status
}

// PredefinedPlans lists seeded plans with deterministic IDs for API smoke tests.
// Plans 0–4 are FINALIZED; plans 5–7 are DRAFT (used for mutation/deletion/carrier-change tests).
var PredefinedPlans = []PredefinedPlan{
	{"11111111-1111-4111-a111-111111111101", Food, Reefer, Finalized},
	{"22222222-2222-4222-a222-222222222202", Chemical, StandardCurtainside, Finalized},
	{"33333333-3333-4333-a333-333333333303", Electronics, Mega, Finalized},
	{"44444444-4444-4444-a444-444444444404", General, Mega, Finalized},
	{"55555555-5555-4555-a555-555555555505", DangerousGoods, Reefer, Finalized},
	{"66666666-6666-4666-a666-666666666606", Chemical, StandardCurtainside, Draft},
	{"77777777-7777-4777-a777-777777777707", General, Mega, Draft},
	{"88888888-8888-4888-a888-888888888808", DangerousGoods, Reefer, Draft},
}

// PredefinedUnitIDs maps plan ID → ordered predefined unit IDs for first N pallets.
// Ensures specific unit IDs exist in DB for DELETE /cargo endpoint tests.
var PredefinedUnitIDs = map[string][]string{
	"11111111-1111-4111-a111-111111111101": {"11111111-1111-4111-a111-000000000001"},
	"66666666-6666-4666-a666-666666666606": {"66666666-6666-4666-a666-000000000001"},
}

// CargoLoadPlan represents a persisted aggregate row.
type CargoLoadPlan struct {
	ID          string
	CarrierType CarrierType
	Status      Status
	CurrentLdm  float64
	Version     int
	CreatedAt   string
	UpdatedAt   string
	Units       []CargoLoadPlanUnit
}

// CargoLoadPlanUnit represents a persisted pallet unit row.
type CargoLoadPlanUnit struct {
	ID                     string
	LoadPlanID             string
	PalletType             PalletType
	CargoType              CargoType
	Description            string
	WeightKg               float64
	CargoHeightMm          int
	IsTemperatureControlled bool
	RequiresSideLoading    bool
	IsBulk                 bool
	HighSecurityRequired   bool
}
