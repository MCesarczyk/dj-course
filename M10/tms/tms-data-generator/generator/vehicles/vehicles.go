package vehicles

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/brianvoe/gofakeit/v6"
)

// ─── Static catalog definitions ──────────────────────────────────────────────

type brandSeed struct {
	name    string
	country string
}

type modelSeed struct {
	brand       string
	name        string
	kind        string
	trailerType string
}

const (
	kindTractor  = "TRACTOR_UNIT"
	kindTrailer  = "SEMI_TRAILER"
	kindVan      = "VAN"       // monolithic panel van (e.g. Fiat Ducato, Renault Master)
	kindBoxTruck = "BOX_TRUCK" // monolithic rigid box truck (e.g. MAN TGL)
)

var brandSeeds = []brandSeed{
	{"Volvo", "Sweden"},
	{"Scania", "Sweden"},
	{"DAF", "Netherlands"},
	{"MAN", "Germany"},
	{"Renault", "France"},
	{"Iveco", "Italy"},
	{"Mercedes-Benz", "Germany"},
	{"Krone", "Germany"},
	{"Schmitz Cargobull", "Germany"},
	{"Wielton", "Poland"},
	{"Kögel", "Germany"},
	{"Fiat", "Italy"},
}

// Tractor and trailer models. Trailer models carry a trailer_type.
var modelSeeds = []modelSeed{
	// Tractor units (ciągniki siodłowe)
	{"Volvo", "FH 460", kindTractor, ""},
	{"Volvo", "FH 500", kindTractor, ""},
	{"Volvo", "FM 420", kindTractor, ""},
	{"Scania", "R450", kindTractor, ""},
	{"Scania", "R500", kindTractor, ""},
	{"Scania", "S500", kindTractor, ""},
	{"DAF", "XF 480", kindTractor, ""},
	{"DAF", "XG 530", kindTractor, ""},
	{"MAN", "TGX 18.470", kindTractor, ""},
	{"MAN", "TGX 18.510", kindTractor, ""},
	{"Renault", "T480", kindTractor, ""},
	{"Renault", "T520", kindTractor, ""},
	{"Iveco", "S-Way 490", kindTractor, ""},
	{"Mercedes-Benz", "Actros 1848", kindTractor, ""},
	{"Mercedes-Benz", "Actros 1851", kindTractor, ""},
	// Semi-trailers (naczepy) — rozróżnione po trailer_type
	{"Krone", "Cool Liner", kindTrailer, "reefer"},
	{"Krone", "Profi Liner", kindTrailer, "curtain"},
	{"Krone", "Dry Liner", kindTrailer, "isotherm"},
	{"Schmitz Cargobull", "S.KO Cool", kindTrailer, "reefer"},
	{"Schmitz Cargobull", "S.CS Universal", kindTrailer, "curtain"},
	{"Schmitz Cargobull", "S.KI Tipper", kindTrailer, "tipper"},
	{"Wielton", "NW 3", kindTrailer, "curtain"},
	{"Wielton", "Master", kindTrailer, "tipper"},
	{"Wielton", "Strong Platform", kindTrailer, "platform"},
	{"Wielton", "Tank Line", kindTrailer, "tank"},
	{"Kögel", "Cargo", kindTrailer, "curtain"},
	{"Kögel", "Port 45", kindTrailer, "container"},
	// Monolithic (rigid) vehicles — self-contained, no tractor, no trailer_type.
	{"Fiat", "Ducato", kindVan, ""},
	{"Renault", "Master", kindVan, ""},
	{"MAN", "TGL", kindBoxTruck, ""},
}

// ─── Fleet generation ─────────────────────────────────────────────────────────

// GenerateFleet builds a coherent fleet: brands, models and `vehicleCount`
// vehicle instances (each linked to a catalog model) plus their documents and
// history events. Ids are assigned sequentially so foreign keys line up.
func GenerateFleet(vehicleCount int) Fleet {
	fleet := Fleet{}

	brandID := map[string]int{}
	for i, b := range brandSeeds {
		id := i + 1
		brandID[b.name] = id
		fleet.Brands = append(fleet.Brands, VehicleBrand{ID: id, Name: b.name, Country: b.country})
	}

	for i, m := range modelSeeds {
		fleet.Models = append(fleet.Models, VehicleModel{
			ID:          i + 1,
			BrandID:     brandID[m.brand],
			Name:        m.name,
			Kind:        m.kind,
			TrailerType: m.trailerType,
		})
	}

	docID := 0
	histID := 0
	for i := 1; i <= vehicleCount; i++ {
		model := fleet.Models[(i-1)%len(fleet.Models)]
		brand := fleet.Brands[model.BrandID-1]
		year := 2019 + (i % 6)
		mileage := 0
		if model.Kind == kindTractor {
			mileage = 80000 + (i*37)%820000
		} else {
			mileage = 20000 + (i*29)%400000
		}
		firstReg := fmt.Sprintf("%04d-%02d-%02d", year, (i%12)+1, (i%27)+1)

		v := Vehicle{
			ID:                    i,
			Make:                  brand.Name,
			Model:                 model.Name,
			Year:                  year,
			FuelTankCapacity:      tankCapacity(model.Kind, i),
			ModelID:               model.ID,
			Kind:                  model.Kind,
			RegistrationNumber:    registrationNumber(),
			VIN:                   vin(),
			FirstRegistrationDate: firstReg,
			MileageKm:             mileage,
			Status:                statusFor(i),
			Specs:                 specsFor(model, i),
		}
		fleet.Vehicles = append(fleet.Vehicles, v)

		// Documents (dokumenty)
		for _, d := range documentsFor(v, model, year) {
			docID++
			d.ID = docID
			d.VehicleID = v.ID
			fleet.Documents = append(fleet.Documents, d)
		}

		// History (krótka historia)
		for _, h := range historyFor(v, firstReg, mileage) {
			histID++
			h.ID = histID
			h.VehicleID = v.ID
			fleet.History = append(fleet.History, h)
		}
	}

	return fleet
}

func tankCapacity(kind string, i int) float64 {
	switch kind {
	case kindTrailer:
		return 0 // trailers have no engine/tank
	case kindVan:
		return 75.0 + float64(i%3)*5.0 // 75–85 l for vans
	case kindBoxTruck:
		return 180.0 + float64(i%5)*10.0 // 180–220 l for box trucks
	default:
		return 400.0 + float64(i%5)*50.0 // 400–600 l for tractors
	}
}

func statusFor(i int) string {
	switch i % 10 {
	case 0:
		return "in_service"
	case 1:
		return "retired"
	default:
		return "active"
	}
}

func registrationNumber() string {
	return fmt.Sprintf("%s %s%s",
		strings.ToUpper(gofakeit.LetterN(2)),
		gofakeit.DigitN(4),
		strings.ToUpper(gofakeit.LetterN(1)),
	)
}

func vin() string {
	return strings.ToUpper(gofakeit.LetterN(3)) + gofakeit.DigitN(14)
}

func specsFor(m VehicleModel, i int) string {
	switch m.Kind {
	case kindTractor:
		powerKw := 300 + (i%12)*15
		return fmt.Sprintf(
			`{"power_kw":%d,"euro_norm":"EURO6","axles":2,"fuel_type":"diesel"}`,
			powerKw,
		)
	case kindVan, kindBoxTruck:
		return monolithicSpecs(m)
	default: // kindTrailer
		hasRefrigeration := m.TrailerType == "reefer"
		volume := 80.0 + float64(i%10)
		return fmt.Sprintf(
			`{"euro_pallets":33,"volume_m3":%.1f,"interior_height_m":2.7,"has_tail_lift":%t,"has_refrigeration":%t}`,
			volume,
			i%4 == 0,
			hasRefrigeration,
		)
	}
}

// monolithicSpecs returns representative technical specs (from public catalog data)
// for the rigid vans / box trucks. Shape: payload, cargo dimensions, GVW, emissions.
func monolithicSpecs(m VehicleModel) string {
	switch m.Name {
	case "Ducato": // Fiat Ducato Maxi L4H2 panel van
		return `{"payload_kg":1500,"cargo_volume_m3":15.0,"cargo_length_mm":4070,"cargo_width_mm":1870,"cargo_height_mm":1930,"gvw_kg":4250,"euro_norm":"EURO6","fuel_type":"diesel"}`
	case "Master": // Renault Master L3H2 panel van
		return `{"payload_kg":1500,"cargo_volume_m3":13.0,"cargo_length_mm":3733,"cargo_width_mm":1765,"cargo_height_mm":1894,"gvw_kg":3500,"euro_norm":"EURO6","fuel_type":"diesel"}`
	case "TGL": // MAN TGL 12t rigid box truck
		return `{"payload_kg":5900,"cargo_volume_m3":40.0,"cargo_length_mm":7200,"cargo_width_mm":2480,"cargo_height_mm":2500,"gvw_kg":12000,"euro_norm":"EURO6","fuel_type":"diesel"}`
	default:
		return `{"euro_norm":"EURO6","fuel_type":"diesel"}`
	}
}

func documentsFor(v Vehicle, m VehicleModel, year int) []VehicleDocument {
	docs := []VehicleDocument{
		{
			DocType:        "registration_certificate",
			DocumentNumber: "DR/" + strconv.Itoa(year) + "/" + gofakeit.DigitN(6),
			IssueDate:      v.FirstRegistrationDate,
		},
		{
			DocType:        "insurance_oc",
			DocumentNumber: "OC/2026/" + gofakeit.DigitN(6),
			IssueDate:      "2026-01-01",
			ExpiryDate:     "2026-12-31",
		},
		{
			DocType:        "technical_inspection",
			DocumentNumber: "SKP/2025/" + gofakeit.DigitN(6),
			IssueDate:      "2025-06-15",
			ExpiryDate:     "2026-06-15",
		},
	}
	// Reefer trailers carry an ATP certificate (świadectwo ATP).
	if m.TrailerType == "reefer" {
		docs = append(docs, VehicleDocument{
			DocType:        "atp_certificate",
			DocumentNumber: "ATP/2024/" + gofakeit.DigitN(5),
			IssueDate:      "2024-04-01",
			ExpiryDate:     "2030-04-01",
		})
	}
	return docs
}

func historyFor(v Vehicle, firstReg string, mileage int) []VehicleHistoryEvent {
	return []VehicleHistoryEvent{
		{
			EventType:   "purchase",
			EventDate:   firstReg,
			MileageKm:   0,
			Description: "Zakup pojazdu i wprowadzenie do floty",
		},
		{
			EventType:   "inspection",
			EventDate:   "2025-06-15",
			MileageKm:   mileage,
			Description: "Okresowe badanie techniczne — wynik pozytywny",
		},
	}
}

// ─── INSERT statement builders ────────────────────────────────────────────────

func sqlStr(s string) string {
	if s == "" {
		return "NULL"
	}
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}

func sqlJSON(s string) string {
	if s == "" {
		return "NULL"
	}
	return "'" + strings.ReplaceAll(s, "'", "''") + "'::jsonb"
}

func sqlIntOrNull(n int) string {
	if n == 0 {
		return "NULL"
	}
	return strconv.Itoa(n)
}

func GenerateBrandsInsertStatements(brands []VehicleBrand) string {
	if len(brands) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("INSERT INTO vehicle_brands (id, name, country) VALUES\n")
	for i, b := range brands {
		sb.WriteString("    (" + strconv.Itoa(b.ID) + ", " + sqlStr(b.Name) + ", " + sqlStr(b.Country) + ")")
		sb.WriteString(terminator(i, len(brands)))
	}
	return sb.String()
}

func GenerateModelsInsertStatements(models []VehicleModel) string {
	if len(models) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("INSERT INTO vehicle_models (id, brand_id, name, kind, trailer_type) VALUES\n")
	for i, m := range models {
		sb.WriteString("    (" +
			strconv.Itoa(m.ID) + ", " +
			strconv.Itoa(m.BrandID) + ", " +
			sqlStr(m.Name) + ", " +
			sqlStr(m.Kind) + ", " +
			sqlStr(m.TrailerType) + ")")
		sb.WriteString(terminator(i, len(models)))
	}
	return sb.String()
}

func GenerateVehiclesInsertStatements(vehicles []Vehicle) string {
	if len(vehicles) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.Grow(len(vehicles) * 120)
	sb.WriteString("INSERT INTO vehicles (id, make, model, year, fuel_tank_capacity, model_id, kind, registration_number, vin, first_registration_date, mileage_km, status, specs) VALUES\n")
	for i, v := range vehicles {
		sb.WriteString("    (" +
			strconv.Itoa(v.ID) + ", " +
			sqlStr(v.Make) + ", " +
			sqlStr(v.Model) + ", " +
			strconv.Itoa(v.Year) + ", " +
			strconv.FormatFloat(v.FuelTankCapacity, 'f', 1, 64) + ", " +
			sqlIntOrNull(v.ModelID) + ", " +
			sqlStr(v.Kind) + ", " +
			sqlStr(v.RegistrationNumber) + ", " +
			sqlStr(v.VIN) + ", " +
			sqlStr(v.FirstRegistrationDate) + ", " +
			strconv.Itoa(v.MileageKm) + ", " +
			sqlStr(v.Status) + ", " +
			sqlJSON(v.Specs) + ")")
		sb.WriteString(terminator(i, len(vehicles)))
	}
	return sb.String()
}

func GenerateDocumentsInsertStatements(docs []VehicleDocument) string {
	if len(docs) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("INSERT INTO vehicle_documents (id, vehicle_id, doc_type, document_number, issue_date, expiry_date, file_url, notes) VALUES\n")
	for i, d := range docs {
		sb.WriteString("    (" +
			strconv.Itoa(d.ID) + ", " +
			strconv.Itoa(d.VehicleID) + ", " +
			sqlStr(d.DocType) + ", " +
			sqlStr(d.DocumentNumber) + ", " +
			sqlStr(d.IssueDate) + ", " +
			sqlStr(d.ExpiryDate) + ", " +
			sqlStr(d.FileURL) + ", " +
			sqlStr(d.Notes) + ")")
		sb.WriteString(terminator(i, len(docs)))
	}
	return sb.String()
}

func GenerateHistoryInsertStatements(events []VehicleHistoryEvent) string {
	if len(events) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("INSERT INTO vehicle_history_events (id, vehicle_id, event_type, event_date, mileage_km, description) VALUES\n")
	for i, e := range events {
		sb.WriteString("    (" +
			strconv.Itoa(e.ID) + ", " +
			strconv.Itoa(e.VehicleID) + ", " +
			sqlStr(e.EventType) + ", " +
			sqlStr(e.EventDate) + ", " +
			strconv.Itoa(e.MileageKm) + ", " +
			sqlStr(e.Description) + ")")
		sb.WriteString(terminator(i, len(events)))
	}
	return sb.String()
}

// GenerateSequenceResyncStatements advances SERIAL sequences past the explicit
// ids inserted above, so API-created rows don't collide with seed ids.
func GenerateSequenceResyncStatements(f Fleet) string {
	var sb strings.Builder
	sb.WriteString("SELECT setval(pg_get_serial_sequence('vehicle_brands', 'id'), " + strconv.Itoa(len(f.Brands)) + ", true);\n")
	sb.WriteString("SELECT setval(pg_get_serial_sequence('vehicle_models', 'id'), " + strconv.Itoa(len(f.Models)) + ", true);\n")
	sb.WriteString("SELECT setval(pg_get_serial_sequence('vehicle_documents', 'id'), " + strconv.Itoa(len(f.Documents)) + ", true);\n")
	sb.WriteString("SELECT setval(pg_get_serial_sequence('vehicle_history_events', 'id'), " + strconv.Itoa(len(f.History)) + ", true);\n")
	return sb.String()
}

func terminator(i, n int) string {
	if i < n-1 {
		return ",\n"
	}
	return ";\n"
}
