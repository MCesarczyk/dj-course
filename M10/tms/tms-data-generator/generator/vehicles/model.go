package vehicles

// VehicleBrand represents a vehicle brand (marka).
type VehicleBrand struct {
	ID      int
	Name    string
	Country string
}

// VehicleModel represents a catalog model (model pojazdu).
// Kind distinguishes tractor units from semi-trailers; TrailerType (only for
// semi-trailers) describes the body kind.
type VehicleModel struct {
	ID          int
	BrandID     int
	Name        string
	Kind        string // TRACTOR_UNIT | SEMI_TRAILER
	TrailerType string // empty for TRACTOR_UNIT
}

// Vehicle represents a vehicle instance (egzemplarz).
type Vehicle struct {
	ID                    int
	Make                  string
	Model                 string
	Year                  int
	FuelTankCapacity      float64 // Maximum fuel capacity in liters
	ModelID               int     // 0 => NULL (legacy rows)
	Kind                  string  // empty => NULL
	RegistrationNumber    string
	VIN                   string
	FirstRegistrationDate string // YYYY-MM-DD, empty => NULL
	MileageKm             int
	Status                string
	Specs                 string // raw JSON object, empty => NULL
}

// VehicleDocument represents a document attached to a vehicle (dokument).
type VehicleDocument struct {
	ID             int
	VehicleID      int
	DocType        string
	DocumentNumber string
	IssueDate      string
	ExpiryDate     string
	FileURL        string
	Notes          string
}

// VehicleHistoryEvent represents a single history event (zdarzenie historii).
type VehicleHistoryEvent struct {
	ID          int
	VehicleID   int
	EventType   string
	EventDate   string
	MileageKm   int
	Description string
}

// Fleet bundles all fleet entities so referential integrity is preserved
// (models reference brands, vehicles reference models, docs/history reference vehicles).
type Fleet struct {
	Brands    []VehicleBrand
	Models    []VehicleModel
	Vehicles  []Vehicle
	Documents []VehicleDocument
	History   []VehicleHistoryEvent
}
