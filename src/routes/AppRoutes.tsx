import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Property from '../pages/Property'
import NotFound from '../pages/NotFound'
import AccessDeniedPage from '../pages/AccessDeniedPage'

import AnimalsPage from '../pages/animals/AnimalsPage'
import NewAnimalPage from '../pages/animals/NewAnimalPage'
import AnimalDetailsPage from '../pages/animals/AnimalDetailsPage'
import EditAnimalPage from '../pages/animals/EditAnimalPage'
import LotsPage from '../pages/animals/LotsPage'

import HealthPage from '../pages/health/HealthPage'
import VaccinationsPage from '../pages/health/VaccinationsPage'
import NewVaccinationPage from '../pages/health/NewVaccinationPage'
import EditVaccinationPage from '../pages/health/EditVaccinationPage'
import TreatmentsPage from '../pages/health/TreatmentsPage'
import NewTreatmentPage from '../pages/health/NewTreatmentPage'
import EditTreatmentPage from '../pages/health/EditTreatmentPage'
import HealthOccurrencesPage from '../pages/health/HealthOccurrencesPage'
import NewHealthOccurrencePage from '../pages/health/NewHealthOccurrencePage'
import EditHealthOccurrencePage from '../pages/health/EditHealthOccurrencePage'

import LandAreasPage from '../pages/land/LandAreasPage'
import NewLandAreaPage from '../pages/land/NewLandAreaPage'
import LandAreaDetailsPage from '../pages/land/LandAreaDetailsPage'
import EditLandAreaPage from '../pages/land/EditLandAreaPage'
import PaddockManagementPage from '../pages/land/PaddockManagementPage'
import NewPaddockOccupationPage from '../pages/land/NewPaddockOccupationPage'
import RuralStructuresPage from '../pages/land/RuralStructuresPage'
import NewRuralStructurePage from '../pages/land/NewRuralStructurePage'
import RuralStructureDetailsPage from '../pages/land/RuralStructureDetailsPage'
import EditRuralStructurePage from '../pages/land/EditRuralStructurePage'
import LandUseHistoryPage from '../pages/land/LandUseHistoryPage'
import NewLandUseRecordPage from '../pages/land/NewLandUseRecordPage'
import LandUseRecordDetailsPage from '../pages/land/LandUseRecordDetailsPage'
import EditLandUseRecordPage from '../pages/land/EditLandUseRecordPage'

import CropCyclesPage from '../pages/crops/CropCyclesPage'
import NewCropCyclePage from '../pages/crops/NewCropCyclePage'
import CropCycleDetailsPage from '../pages/crops/CropCycleDetailsPage'
import EditCropCyclePage from '../pages/crops/EditCropCyclePage'
import SoilAnalysesPage from '../pages/crops/SoilAnalysesPage'
import NewSoilAnalysisPage from '../pages/crops/NewSoilAnalysisPage'
import SoilAnalysisDetailsPage from '../pages/crops/SoilAnalysisDetailsPage'
import EditSoilAnalysisPage from '../pages/crops/EditSoilAnalysisPage'
import CropManagementsPage from '../pages/crops/CropManagementsPage'
import NewCropManagementPage from '../pages/crops/NewCropManagementPage'
import CropManagementDetailsPage from '../pages/crops/CropManagementDetailsPage'
import EditCropManagementPage from '../pages/crops/EditCropManagementPage'
import HarvestRecordsPage from '../pages/crops/HarvestRecordsPage'
import NewHarvestRecordPage from '../pages/crops/NewHarvestRecordPage'
import HarvestRecordDetailsPage from '../pages/crops/HarvestRecordDetailsPage'
import EditHarvestRecordPage from '../pages/crops/EditHarvestRecordPage'
import AgriculturalCycleOverviewPage from '../pages/crops/AgriculturalCycleOverviewPage'
import AgriculturalCycleDetailsPage from '../pages/crops/AgriculturalCycleDetailsPage'

import MachinesPage from '../pages/machines/MachinesPage'
import NewMachinePage from '../pages/machines/NewMachinePage'
import MachineDetailsPage from '../pages/machines/MachineDetailsPage'
import EditMachinePage from '../pages/machines/EditMachinePage'
import MachineMaintenanceRecordsPage from '../pages/machines/MachineMaintenanceRecordsPage'
import NewMachineMaintenancePage from '../pages/machines/NewMachineMaintenancePage'
import MachineMaintenanceDetailsPage from '../pages/machines/MachineMaintenanceDetailsPage'
import EditMachineMaintenancePage from '../pages/machines/EditMachineMaintenancePage'
import MachineUsageRecordsPage from '../pages/machines/MachineUsageRecordsPage'
import NewMachineUsagePage from '../pages/machines/NewMachineUsagePage'
import MachineUsageDetailsPage from '../pages/machines/MachineUsageDetailsPage'
import EditMachineUsagePage from '../pages/machines/EditMachineUsagePage'

import InventoryItemsPage from '../pages/inventory/InventoryItemsPage'
import NewInventoryItemPage from '../pages/inventory/NewInventoryItemPage'
import InventoryItemDetailsPage from '../pages/inventory/InventoryItemDetailsPage'
import EditInventoryItemPage from '../pages/inventory/EditInventoryItemPage'
import InventoryMovementsPage from '../pages/inventory/InventoryMovementsPage'
import NewInventoryMovementPage from '../pages/inventory/NewInventoryMovementPage'
import InventoryMovementDetailsPage from '../pages/inventory/InventoryMovementDetailsPage'
import InventoryAlertsPage from '../pages/inventory/InventoryAlertsPage'

import FinanceDashboardPage from '../pages/finance/FinanceDashboardPage'
import FinancialCategoriesPage from '../pages/finance/FinancialCategoriesPage'
import NewFinancialCategoryPage from '../pages/finance/NewFinancialCategoryPage'
import EditFinancialCategoryPage from '../pages/finance/EditFinancialCategoryPage'
import RevenuesPage from '../pages/finance/RevenuesPage'
import NewRevenuePage from '../pages/finance/NewRevenuePage'
import RevenueDetailsPage from '../pages/finance/RevenueDetailsPage'
import EditRevenuePage from '../pages/finance/EditRevenuePage'
import ExpensesPage from '../pages/finance/ExpensesPage'
import NewExpensePage from '../pages/finance/NewExpensePage'
import ExpenseDetailsPage from '../pages/finance/ExpenseDetailsPage'
import EditExpensePage from '../pages/finance/EditExpensePage'

import EmployeesPage from '../pages/employees/EmployeesPage'
import NewEmployeePage from '../pages/employees/NewEmployeePage'
import EmployeeDetailsPage from '../pages/employees/EmployeeDetailsPage'
import EditEmployeePage from '../pages/employees/EditEmployeePage'

import AgendaPage from '../pages/agenda/AgendaPage'
import NewAgendaActivityPage from '../pages/agenda/NewAgendaActivityPage'
import AgendaActivityDetailsPage from '../pages/agenda/AgendaActivityDetailsPage'
import EditAgendaActivityPage from '../pages/agenda/EditAgendaActivityPage'
import AlertsPage from '../pages/alerts/AlertsPage'

import ReportsPage from '../pages/reports/ReportsPage'
import PropertyMapPage from '../pages/map/PropertyMapPage'
import IntelligencePage from '../pages/intelligence/IntelligencePage'
import PropertySetupPage from '../pages/PropertySetupPage'

import { ProtectedRoute } from '../components/common/ProtectedRoute'
import { PublicOnlyRoute } from '../components/common/PublicOnlyRoute'
import { PermissionRoute } from '../components/common/PermissionRoute'
import { PropertyReadyRoute } from '../components/common/PropertyReadyRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/configuracao-inicial"
          element={<PropertySetupPage />}
        />

        <Route element={<PropertyReadyRoute />}>
          <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/acesso-negado" element={<AccessDeniedPage />} />

          <Route element={<PermissionRoute permission="intelligence" />}>
            <Route path="/inteligencia" element={<IntelligencePage />} />
          </Route>

          <Route element={<PermissionRoute permission="agenda" />}>
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/agenda/novo" element={<NewAgendaActivityPage />} />
            <Route
              path="/agenda/:id"
              element={<AgendaActivityDetailsPage />}
            />
            <Route
              path="/agenda/:id/editar"
              element={<EditAgendaActivityPage />}
            />
            <Route path="/alertas" element={<AlertsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="animals" />}>
            <Route path="/animais" element={<AnimalsPage />} />
            <Route path="/animais/novo" element={<NewAnimalPage />} />
            <Route path="/animais/lotes" element={<LotsPage />} />
            <Route path="/animais/:id" element={<AnimalDetailsPage />} />
            <Route
              path="/animais/:id/editar"
              element={<EditAnimalPage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="health" />}>
            <Route path="/saude-animal" element={<HealthPage />} />
            <Route
              path="/saude-animal/vacinacoes"
              element={<VaccinationsPage />}
            />
            <Route
              path="/saude-animal/vacinacoes/nova"
              element={<NewVaccinationPage />}
            />
            <Route
              path="/saude-animal/vacinacoes/:id/editar"
              element={<EditVaccinationPage />}
            />
            <Route
              path="/saude-animal/tratamentos"
              element={<TreatmentsPage />}
            />
            <Route
              path="/saude-animal/tratamentos/novo"
              element={<NewTreatmentPage />}
            />
            <Route
              path="/saude-animal/tratamentos/:id/editar"
              element={<EditTreatmentPage />}
            />
            <Route
              path="/saude-animal/ocorrencias"
              element={<HealthOccurrencesPage />}
            />
            <Route
              path="/saude-animal/ocorrencias/nova"
              element={<NewHealthOccurrencePage />}
            />
            <Route
              path="/saude-animal/ocorrencias/:id/editar"
              element={<EditHealthOccurrencePage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="land" />}>
            <Route path="/terras" element={<LandAreasPage />} />
            <Route path="/terras/nova" element={<NewLandAreaPage />} />
            <Route
              path="/terras/manejo"
              element={<PaddockManagementPage />}
            />
            <Route
              path="/terras/manejo/nova"
              element={<NewPaddockOccupationPage />}
            />
            <Route
              path="/terras/estruturas"
              element={<RuralStructuresPage />}
            />
            <Route
              path="/terras/estruturas/nova"
              element={<NewRuralStructurePage />}
            />
            <Route
              path="/terras/estruturas/:id"
              element={<RuralStructureDetailsPage />}
            />
            <Route
              path="/terras/estruturas/:id/editar"
              element={<EditRuralStructurePage />}
            />
            <Route
              path="/terras/historico"
              element={<LandUseHistoryPage />}
            />
            <Route
              path="/terras/historico/novo"
              element={<NewLandUseRecordPage />}
            />
            <Route
              path="/terras/historico/:id"
              element={<LandUseRecordDetailsPage />}
            />
            <Route
              path="/terras/historico/:id/editar"
              element={<EditLandUseRecordPage />}
            />
            <Route path="/terras/:id" element={<LandAreaDetailsPage />} />
            <Route
              path="/terras/:id/editar"
              element={<EditLandAreaPage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="crops" />}>
            <Route path="/cultivos" element={<CropCyclesPage />} />
            <Route path="/cultivos/novo" element={<NewCropCyclePage />} />
            <Route
              path="/cultivos/solo"
              element={<SoilAnalysesPage />}
            />
            <Route
              path="/cultivos/solo/nova"
              element={<NewSoilAnalysisPage />}
            />
            <Route
              path="/cultivos/solo/:id"
              element={<SoilAnalysisDetailsPage />}
            />
            <Route
              path="/cultivos/solo/:id/editar"
              element={<EditSoilAnalysisPage />}
            />
            <Route
              path="/cultivos/manejos"
              element={<CropManagementsPage />}
            />
            <Route
              path="/cultivos/manejos/novo"
              element={<NewCropManagementPage />}
            />
            <Route
              path="/cultivos/manejos/:id"
              element={<CropManagementDetailsPage />}
            />
            <Route
              path="/cultivos/manejos/:id/editar"
              element={<EditCropManagementPage />}
            />
            <Route
              path="/cultivos/colheitas"
              element={<HarvestRecordsPage />}
            />
            <Route
              path="/cultivos/colheitas/nova"
              element={<NewHarvestRecordPage />}
            />
            <Route
              path="/cultivos/colheitas/:id"
              element={<HarvestRecordDetailsPage />}
            />
            <Route
              path="/cultivos/colheitas/:id/editar"
              element={<EditHarvestRecordPage />}
            />
            <Route
              path="/cultivos/ciclo-agricola"
              element={<AgriculturalCycleOverviewPage />}
            />
            <Route
              path="/cultivos/ciclo-agricola/:cropCycleId"
              element={<AgriculturalCycleDetailsPage />}
            />
            <Route
              path="/cultivos/:id"
              element={<CropCycleDetailsPage />}
            />
            <Route
              path="/cultivos/:id/editar"
              element={<EditCropCyclePage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="machines" />}>
            <Route path="/maquinas" element={<MachinesPage />} />
            <Route path="/maquinas/nova" element={<NewMachinePage />} />
            <Route
              path="/maquinas/manutencoes"
              element={<MachineMaintenanceRecordsPage />}
            />
            <Route
              path="/maquinas/manutencoes/nova"
              element={<NewMachineMaintenancePage />}
            />
            <Route
              path="/maquinas/manutencoes/:id"
              element={<MachineMaintenanceDetailsPage />}
            />
            <Route
              path="/maquinas/manutencoes/:id/editar"
              element={<EditMachineMaintenancePage />}
            />
            <Route
              path="/maquinas/utilizacoes"
              element={<MachineUsageRecordsPage />}
            />
            <Route
              path="/maquinas/utilizacoes/nova"
              element={<NewMachineUsagePage />}
            />
            <Route
              path="/maquinas/utilizacoes/:id"
              element={<MachineUsageDetailsPage />}
            />
            <Route
              path="/maquinas/utilizacoes/:id/editar"
              element={<EditMachineUsagePage />}
            />
            <Route
              path="/maquinas/:id"
              element={<MachineDetailsPage />}
            />
            <Route
              path="/maquinas/:id/editar"
              element={<EditMachinePage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="inventory" />}>
            <Route path="/estoque" element={<InventoryItemsPage />} />
            <Route
              path="/estoque/novo"
              element={<NewInventoryItemPage />}
            />
            <Route
              path="/estoque/alertas"
              element={<InventoryAlertsPage />}
            />
            <Route
              path="/estoque/movimentacoes"
              element={<InventoryMovementsPage />}
            />
            <Route
              path="/estoque/movimentacoes/nova"
              element={<NewInventoryMovementPage />}
            />
            <Route
              path="/estoque/movimentacoes/:id"
              element={<InventoryMovementDetailsPage />}
            />
            <Route
              path="/estoque/:id"
              element={<InventoryItemDetailsPage />}
            />
            <Route
              path="/estoque/:id/editar"
              element={<EditInventoryItemPage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="finance" />}>
            <Route
              path="/financeiro"
              element={<FinanceDashboardPage />}
            />
            <Route
              path="/financeiro/categorias"
              element={<FinancialCategoriesPage />}
            />
            <Route
              path="/financeiro/categorias/nova"
              element={<NewFinancialCategoryPage />}
            />
            <Route
              path="/financeiro/categorias/:id/editar"
              element={<EditFinancialCategoryPage />}
            />
            <Route
              path="/financeiro/receitas"
              element={<RevenuesPage />}
            />
            <Route
              path="/financeiro/receitas/nova"
              element={<NewRevenuePage />}
            />
            <Route
              path="/financeiro/receitas/:id"
              element={<RevenueDetailsPage />}
            />
            <Route
              path="/financeiro/receitas/:id/editar"
              element={<EditRevenuePage />}
            />
            <Route
              path="/financeiro/despesas"
              element={<ExpensesPage />}
            />
            <Route
              path="/financeiro/despesas/nova"
              element={<NewExpensePage />}
            />
            <Route
              path="/financeiro/despesas/:id"
              element={<ExpenseDetailsPage />}
            />
            <Route
              path="/financeiro/despesas/:id/editar"
              element={<EditExpensePage />}
            />
          </Route>

          <Route element={<PermissionRoute permission="property" />}>
            <Route path="/propriedade" element={<Property />} />
          </Route>

          <Route element={<PermissionRoute permission="reports" />}>
            <Route path="/relatorios" element={<ReportsPage />} />
          </Route>

          <Route element={<PermissionRoute permission="map" />}>
            <Route path="/mapa" element={<PropertyMapPage />} />
          </Route>

          <Route element={<PermissionRoute adminOnly />}>
            <Route path="/funcionarios" element={<EmployeesPage />} />
            <Route
              path="/funcionarios/novo"
              element={<NewEmployeePage />}
            />
            <Route
              path="/funcionarios/:id"
              element={<EmployeeDetailsPage />}
            />
            <Route
              path="/funcionarios/:id/editar"
              element={<EditEmployeePage />}
            />
          </Route>
        </Route>
      </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}