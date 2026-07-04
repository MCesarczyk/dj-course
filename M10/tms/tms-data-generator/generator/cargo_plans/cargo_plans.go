package cargo_plans

import (
	"fmt"
	"math"
	"math/rand"
	"strings"
	"time"

	"github.com/brianvoe/gofakeit/v6"
)

// Carrier capabilities – aligned with tms-api CarrierFactory.
const (
	maxWeightStandardKg = 24000
	maxWeightReeferKg   = 22000
	maxLdmStandard      = 13.6
	maxLdmReefer        = 13.4
	heightStandardMm    = 2700
	heightMegaMm        = 3000
	heightReeferMm      = 2600
)

// cargoDescriptor provides human-readable snippets for unit descriptions.
var cargoDescriptors = map[CargoType][]string{
	Food:        {"świeże mięso", "mrożonki", "nabiał", "warzywa", "owoce", "pieczywo"},
	Chemical:    {"poliuretany", "polimery ciekłe", "substancje przemysłowe", "środki czyszczące"},
	Electronics: {"komponenty elektroniczne", "smartfony", "obwody drukowane", "czujniki"},
	General:     {"odzież", "artykuły gospodarstwa", "meblarstwo", "opakowania"},
	DangerousGoods: {"baterie litowe", "środki żrące", "materiały ADR", "substancje niebezpieczne"},
}

// GenerateCargoLoadPlans generates count cargo load plans.
// First len(PredefinedPlans) plans use deterministic IDs, cargo types, carriers and statuses.
// Each plan has homogeneous cargo (one type) – respects coloading rules.
// Remaining plans are ~2/3 FINALIZED, ~1/3 DRAFT.
func GenerateCargoLoadPlans(count int) []CargoLoadPlan {
	plans := make([]CargoLoadPlan, 0, count)

	for i := 0; i < count; i++ {
		var planID string
		var cargoType CargoType
		var carrier carrierSpec
		var status Status
		var version int

		if i < len(PredefinedPlans) {
			pp := PredefinedPlans[i]
			planID = pp.ID
			cargoType = pp.CargoType
			carrier = carrierSpecForType(pp.CarrierType)
			status = pp.Status
			if status == Draft {
				version = 1 + rand.Intn(3)
			} else {
				version = 3 + rand.Intn(4)
			}
		} else {
			planID = gofakeit.UUID()
			cargoType = randomCargoType()
			carrier = carrierForCargo(cargoType)
			if i >= count*2/3 {
				status = Draft
				version = 1 + rand.Intn(3)
			} else {
				status = Finalized
				version = 3 + rand.Intn(4)
			}
		}

		unitCount := 2 + rand.Intn(5) // 2–6 units per plan
		units := generateHomogeneousUnits(planID, carrier, cargoType, unitCount, PredefinedUnitIDs[planID])

		totalLdm := 0.0
		for _, u := range units {
			totalLdm += ldmForPallet(u.PalletType)
		}
		totalLdm = math.Round(totalLdm*100) / 100

		// Ensure LDM and weight within carrier limits
		totalWeight := 0.0
		for _, u := range units {
			totalWeight += u.WeightKg
		}
		maxWeight := maxWeightForCarrier(carrier.Type)
		if totalWeight > maxWeight || totalLdm > maxLdmForCarrier(carrier.Type) {
			// Truncate units to stay within limits (simplified: reduce count)
			for len(units) > 2 && (totalWeight > maxWeight || totalLdm > maxLdmForCarrier(carrier.Type)) {
				units = units[:len(units)-1]
				totalLdm = 0
				totalWeight = 0
				for _, u := range units {
					totalLdm += ldmForPallet(u.PalletType)
					totalWeight += u.WeightKg
				}
			}
			totalLdm = math.Round(totalLdm*100) / 100
		}

		createdAt, updatedAt := randomTimestamps()

		plans = append(plans, CargoLoadPlan{
			ID:          planID,
			CarrierType: carrier.Type,
			Status:      status,
			CurrentLdm:  totalLdm,
			Version:     version,
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
			Units:       units,
		})
	}

	return plans
}

func carrierForCargo(c CargoType) carrierSpec {
	switch c {
	case Food:
		return carrierSpecs[2] // Reefer
	case Chemical, General, Electronics:
		return carrierSpecs[rand.Intn(2)] // Standard or Mega
	case DangerousGoods:
		return carrierSpecs[2] // Reefer (high security)
	default:
		return carrierSpecs[0]
	}
}

// carrierSpecForType returns the carrierSpec matching the given CarrierType.
func carrierSpecForType(t CarrierType) carrierSpec {
	for _, spec := range carrierSpecs {
		if spec.Type == t {
			return spec
		}
	}
	return carrierSpecs[0]
}

func randomCargoType() CargoType {
	types := []CargoType{General, Food, Electronics, Chemical, DangerousGoods}
	return types[rand.Intn(len(types))]
}

func maxWeightForCarrier(t CarrierType) float64 {
	if t == Reefer {
		return maxWeightReeferKg
	}
	return maxWeightStandardKg
}

func maxLdmForCarrier(t CarrierType) float64 {
	if t == Reefer {
		return maxLdmReefer
	}
	return maxLdmStandard
}

// generateHomogeneousUnits creates units of a single cargo type (homogeneous load).
// predefinedIDs: if non-empty, the first len(predefinedIDs) units get those IDs instead of random UUIDs.
func generateHomogeneousUnits(planID string, carrier carrierSpec, cargoType CargoType, count int, predefinedIDs []string) []CargoLoadPlanUnit {
	pallets := palletsForCargoAndCarrier(carrier, cargoType)
	if len(pallets) == 0 {
		// Fallback: use first compatible pallet
		pallets = compatiblePallets(carrier)
	}
	if len(pallets) == 0 {
		return nil
	}

	units := make([]CargoLoadPlanUnit, 0, count)
	descriptors := cargoDescriptors[cargoType]
	if descriptors == nil {
		descriptors = []string{string(cargoType)}
	}

	for i := 0; i < count; i++ {
		pallet := pallets[rand.Intn(len(pallets))]
		maxWeight := math.Min(pallet.MaxWeightKg*0.8, 2000) // stay within capacity
		weightKg := math.Round((100+rand.Float64()*(maxWeight-100))*100) / 100

		heightMm := heightForCarrier(carrier.Type)
		cargoHeightMm := heightMm - pallet.BaseHeightMm
		if cargoHeightMm < 200 {
			cargoHeightMm = 200
		}
		if cargoHeightMm > 1500 {
			cargoHeightMm = 500 + rand.Intn(1000)
		}

		isTemp := carrier.HasClimateControl && cargoType == Food
		requiresSide := carrier.SupportsSideLoading && rand.Intn(3) == 0
		isBulk := false
		highSecurity := carrier.HasHighSecurityLock && (cargoType == DangerousGoods || cargoType == Electronics)

		req := UnitRequirements{
			IsTemperatureControlled: isTemp,
			RequiresSideLoading:     requiresSide,
			IsBulk:                  isBulk,
			HighSecurityRequired:    highSecurity,
		}
		if !CarrierSatisfiesCargoRequirements(carrier, req) {
			continue // retry with different requirements
		}

		desc := string(cargoType) + " – " + descriptors[rand.Intn(len(descriptors))]
		if rand.Intn(2) == 0 {
			desc += " " + gofakeit.Word()
		}

		unitID := gofakeit.UUID()
		if i < len(predefinedIDs) {
			unitID = predefinedIDs[i]
		}

		units = append(units, CargoLoadPlanUnit{
			ID:                      unitID,
			LoadPlanID:              planID,
			PalletType:              pallet.Type,
			CargoType:               cargoType,
			Description:             desc,
			WeightKg:                weightKg,
			CargoHeightMm:           cargoHeightMm,
			IsTemperatureControlled: isTemp,
			RequiresSideLoading:     requiresSide,
			IsBulk:                  isBulk,
			HighSecurityRequired:   highSecurity,
		})
	}

	return units
}

func heightForCarrier(t CarrierType) int {
	switch t {
	case Mega:
		return heightMegaMm
	case Reefer:
		return heightReeferMm
	default:
		return heightStandardMm
	}
}

// palletsForCargoAndCarrier returns pallets that support cargoType and work with carrier.
func palletsForCargoAndCarrier(carrier carrierSpec, cargoType CargoType) []palletSpec {
	var result []palletSpec
	for _, p := range palletSpecs {
		if !palletSupportsCargo(p, cargoType) {
			continue
		}
		if !carrierSupportsPallet(carrier, p, cargoType) {
			continue
		}
		result = append(result, p)
	}
	return result
}

func palletSupportsCargo(p palletSpec, c CargoType) bool {
	for _, allowed := range p.AllowedCargo {
		if allowed == c {
			return true
		}
	}
	return false
}

func carrierSupportsPallet(carrier carrierSpec, p palletSpec, c CargoType) bool {
	// High security required for ADR – only Reefer has it
	if c == DangerousGoods && !carrier.HasHighSecurityLock {
		return false
	}
	// Reefer: Food pallets or ADR pallets
	if carrier.Type == Reefer {
		return palletSupportsCargo(p, Food) || palletSupportsCargo(p, DangerousGoods) || palletSupportsCargo(p, Chemical)
	}
	// Standard/Mega: no ADR (no high security), but Chemical/General/Electronics/Food ok
	return true
}

// compatiblePallets returns pallet specs that work with the carrier (legacy fallback).
func compatiblePallets(carrier carrierSpec) []palletSpec {
	if carrier.Type == Reefer {
		var result []palletSpec
		for _, p := range palletSpecs {
			for _, c := range p.AllowedCargo {
				if c == Food || c == Chemical || c == DangerousGoods {
					result = append(result, p)
					break
				}
			}
		}
		return result
	}
	var result []palletSpec
	for _, p := range palletSpecs {
		hasOnlyAdr := true
		for _, c := range p.AllowedCargo {
			if c != DangerousGoods && c != Chemical {
				hasOnlyAdr = false
				break
			}
		}
		if !hasOnlyAdr || carrier.HasHighSecurityLock {
			result = append(result, p)
		}
	}
	return result
}

func ldmForPallet(p PalletType) float64 {
	for _, spec := range palletSpecs {
		if spec.Type == p {
			return spec.LdmPerUnit
		}
	}
	return 0.40
}

func randomTimestamps() (createdAt, updatedAt string) {
	now := time.Now()
	created := now.Add(-time.Duration(1+rand.Intn(30)) * 24 * time.Hour)
	updated := created.Add(time.Duration(rand.Intn(48)) * time.Hour)
	if updated.Before(created) {
		updated = created
	}
	return created.Format("2006-01-02 15:04:05-07"), updated.Format("2006-01-02 15:04:05-07")
}

// GeneratePlanInsertStatements returns INSERT SQL for cargo_load_plans rows.
func GeneratePlanInsertStatements(plans []CargoLoadPlan) string {
	if len(plans) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.Grow(len(plans) * 200)
	sb.WriteString("INSERT INTO cargo_plans.cargo_load_plans (id, carrier_type, status, current_ldm, version, created_at, updated_at) VALUES\n")

	for i, p := range plans {
		sb.WriteString(fmt.Sprintf("    ('%s', '%s', '%s', %.2f, %d, '%s'::timestamptz, '%s'::timestamptz)",
			p.ID, p.CarrierType, p.Status, p.CurrentLdm, p.Version, p.CreatedAt, p.UpdatedAt))
		if i < len(plans)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString(";\n\n")
		}
	}

	return sb.String()
}

// GenerateUnitInsertStatements returns INSERT SQL for cargo_load_plan_units rows.
func GenerateUnitInsertStatements(plans []CargoLoadPlan) string {
	var allUnits []CargoLoadPlanUnit
	for _, p := range plans {
		allUnits = append(allUnits, p.Units...)
	}

	if len(allUnits) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.Grow(len(allUnits) * 300)
	sb.WriteString("INSERT INTO cargo_plans.cargo_load_plan_units\n")
	sb.WriteString("    (id, load_plan_id, pallet_type, cargo_type, description, weight_kg, cargo_height_mm,\n")
	sb.WriteString("     is_temperature_controlled, requires_side_loading, is_bulk, high_security_required)\n")
	sb.WriteString("VALUES\n")

	for i, u := range allUnits {
		desc := strings.ReplaceAll(u.Description, "'", "''")
		sb.WriteString(fmt.Sprintf("    ('%s', '%s', '%s', '%s', '%s', %.2f, %d, %s, %s, %s, %s)",
			u.ID, u.LoadPlanID, u.PalletType, u.CargoType, desc,
			u.WeightKg, u.CargoHeightMm,
			boolSQL(u.IsTemperatureControlled),
			boolSQL(u.RequiresSideLoading),
			boolSQL(u.IsBulk),
			boolSQL(u.HighSecurityRequired),
		))
		if i < len(allUnits)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString(";\n")
		}
	}

	return sb.String()
}

func boolSQL(b bool) string {
	if b {
		return "true"
	}
	return "false"
}
