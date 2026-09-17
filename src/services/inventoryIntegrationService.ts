import {
  CropManagement,
  FinancialTransaction,
  InventoryMovement,
  MachineMaintenanceRecord,
  Treatment,
  User,
  Vaccination,
} from '../types'
import {
  createVaccination,
  deleteVaccination,
  createTreatment,
  deleteTreatment,
} from './healthService'
import {
  createCropManagement,
  deleteCropManagement,
} from './cropManagementService'
import {
  createMachineMaintenanceRecord,
  deleteMachineMaintenanceRecord,
} from './machineMaintenanceService'
import {
  createInventoryMovement,
  createInventoryMovementsBatch,
  validateIntegratedMovementsBatch,
  validateVaccinationStockConsumption,
} from './inventoryService'
import {
  buildPostPersistenceFinancialError,
  createFinancialTransactionWithOrigin,
  preflightIntegratedFinancial,
  type IntegratedFinancialInput,
} from './financialIntegrationService'
import { requirePermissions } from './permissionService'

export interface VaccinationConsumptionInput {
  inventoryItemId: string
  quantity: number
}

export interface ConsumptionLineInput {
  inventoryItemId: string
  quantity: number
}

export interface CreateVaccinationWithConsumptionResult {
  vaccination: Vaccination
  movement: InventoryMovement
  financialTransaction?: FinancialTransaction
}

export interface CreateTreatmentWithConsumptionResult {
  treatment: Treatment
  movements: InventoryMovement[]
  financialTransaction?: FinancialTransaction
}

export interface CreateCropManagementWithConsumptionResult {
  management: CropManagement
  movements: InventoryMovement[]
  financialTransaction?: FinancialTransaction
}

export interface CreateMachineMaintenanceWithConsumptionResult {
  record: MachineMaintenanceRecord
  movements: InventoryMovement[]
  financialTransaction?: FinancialTransaction
}

// -------------------- Vacinação --------------------

export function createVaccinationWithConsumption(
  user: User | null,
  vaccinationData: Omit<Vaccination, 'id' | 'createdAt' | 'updatedAt'>,
  consumption: VaccinationConsumptionInput,
  financial?: IntegratedFinancialInput,
): CreateVaccinationWithConsumptionResult {
  requirePermissions(user, ['health', 'inventory'])

  validateVaccinationStockConsumption(
    consumption.inventoryItemId,
    consumption.quantity,
    vaccinationData.applicationDate,
    vaccinationData.responsible,
  )

  if (financial) {
    preflightIntegratedFinancial(user, financial, {
      module: 'health',
      type: 'vaccination',
      recordId: '__pre__',
    })
  }

  const vaccination = createVaccination(vaccinationData)

  let movement: InventoryMovement

  try {
    movement = createInventoryMovement({
      inventoryItemId: consumption.inventoryItemId,
      type: 'Saída',
      movementDate: vaccination.applicationDate,
      quantity: consumption.quantity,
      reason: 'Baixa por vacinação',
      responsible: vaccination.responsible,
      notes: undefined,
      origin: {
        module: 'health',
        type: 'vaccination',
        recordId: vaccination.id,
      },
    })
  } catch (movementError) {
    let rolledBack = false
    let rollbackError: unknown = null

    try {
      rolledBack = deleteVaccination(vaccination.id)
    } catch (error) {
      rollbackError = error
    }

    if (rollbackError !== null) {
      throw new Error(
        'Falha parcial: a movimentação de estoque não pôde ser registrada e o rollback da vacinação também falhou. Verifique o estoque e a vacinação manualmente.',
      )
    }

    if (!rolledBack) {
      throw new Error(
        'Falha parcial: a movimentação de estoque não pôde ser registrada e o rollback da vacinação não removeu o registro. Verifique o estoque e a vacinação manualmente.',
      )
    }

    throw movementError
  }

  if (!financial) {
    return { vaccination, movement }
  }

  try {
    const financialTransaction = createFinancialTransactionWithOrigin(
      user,
      financial,
      {
        module: 'health',
        type: 'vaccination',
        recordId: vaccination.id,
      },
    )

    return { vaccination, movement, financialTransaction }
  } catch {
    throw buildPostPersistenceFinancialError()
  }
}

// -------------------- Tratamento --------------------

export function createTreatmentWithConsumption(
  user: User | null,
  treatmentData: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt'>,
  consumptions: ConsumptionLineInput[],
  financial?: IntegratedFinancialInput,
): CreateTreatmentWithConsumptionResult {
  requirePermissions(user, ['health', 'inventory'])

  if (consumptions.length === 0) {
    throw new Error('Informe ao menos um item para baixa.')
  }

  validateIntegratedMovementsBatch(
    consumptions,
    treatmentData.startDate,
    {
      module: 'health',
      type: 'treatment',
      recordId: '__pre__',
    },
    treatmentData.responsible,
    'Baixa por tratamento',
  )

  if (financial) {
    preflightIntegratedFinancial(user, financial, {
      module: 'health',
      type: 'treatment',
      recordId: '__pre__',
    })
  }

  const treatment = createTreatment(treatmentData)

  let movements: InventoryMovement[]

  try {
    movements = createInventoryMovementsBatch(
      consumptions.map(line => ({
        inventoryItemId: line.inventoryItemId,
        type: 'Saída' as const,
        movementDate: treatment.startDate,
        quantity: line.quantity,
        reason: 'Baixa por tratamento',
        responsible: treatment.responsible,
        notes: undefined,
        origin: {
          module: 'health' as const,
          type: 'treatment' as const,
          recordId: treatment.id,
        },
      })),
    )
  } catch (movementError) {
    let rolledBack = false
    let rollbackError: unknown = null

    try {
      rolledBack = deleteTreatment(treatment.id)
    } catch (error) {
      rollbackError = error
    }

    if (rollbackError !== null) {
      throw new Error(
        'Falha parcial: as movimentações de estoque não puderam ser registradas e o rollback do tratamento também falhou. Verifique o estoque e o tratamento manualmente.',
      )
    }

    if (!rolledBack) {
      throw new Error(
        'Falha parcial: as movimentações de estoque não puderam ser registradas e o rollback do tratamento não removeu o registro. Verifique o estoque e o tratamento manualmente.',
      )
    }

    throw movementError
  }

  if (!financial) {
    return { treatment, movements }
  }

  try {
    const financialTransaction = createFinancialTransactionWithOrigin(
      user,
      financial,
      {
        module: 'health',
        type: 'treatment',
        recordId: treatment.id,
      },
    )

    return { treatment, movements, financialTransaction }
  } catch {
    throw buildPostPersistenceFinancialError()
  }
}

// -------------------- Manejo agrícola --------------------

export function createCropManagementWithConsumption(
  user: User | null,
  managementData: Omit<CropManagement, 'id' | 'createdAt' | 'updatedAt'>,
  consumptions: ConsumptionLineInput[],
  financial?: IntegratedFinancialInput,
): CreateCropManagementWithConsumptionResult {
  requirePermissions(user, ['crops', 'inventory'])

  if (consumptions.length === 0) {
    throw new Error('Informe ao menos um item para baixa.')
  }

  validateIntegratedMovementsBatch(
    consumptions,
    managementData.date,
    {
      module: 'crops',
      type: 'crop-management',
      recordId: '__pre__',
    },
    managementData.responsible,
    'Baixa por manejo agrícola',
  )

  if (financial) {
    preflightIntegratedFinancial(user, financial, {
      module: 'crops',
      type: 'crop-management',
      recordId: '__pre__',
    })
  }

  const management = createCropManagement(managementData)

  let movements: InventoryMovement[]

  try {
    movements = createInventoryMovementsBatch(
      consumptions.map(line => ({
        inventoryItemId: line.inventoryItemId,
        type: 'Saída' as const,
        movementDate: management.date,
        quantity: line.quantity,
        reason: 'Baixa por manejo agrícola',
        responsible: management.responsible,
        notes: undefined,
        origin: {
          module: 'crops' as const,
          type: 'crop-management' as const,
          recordId: management.id,
        },
      })),
    )
  } catch (movementError) {
    let rolledBack = false
    let rollbackError: unknown = null

    try {
      rolledBack = deleteCropManagement(management.id)
    } catch (error) {
      rollbackError = error
    }

    if (rollbackError !== null) {
      throw new Error(
        'Falha parcial: as movimentações de estoque não puderam ser registradas e o rollback do manejo também falhou. Verifique o estoque e o manejo manualmente.',
      )
    }

    if (!rolledBack) {
      throw new Error(
        'Falha parcial: as movimentações de estoque não puderam ser registradas e o rollback do manejo não removeu o registro. Verifique o estoque e o manejo manualmente.',
      )
    }

    throw movementError
  }

  if (!financial) {
    return { management, movements }
  }

  try {
    const financialTransaction = createFinancialTransactionWithOrigin(
      user,
      financial,
      {
        module: 'crops',
        type: 'crop-management',
        recordId: management.id,
      },
    )

    return { management, movements, financialTransaction }
  } catch {
    throw buildPostPersistenceFinancialError()
  }
}

// -------------------- Manutenção de máquina --------------------

export function createMachineMaintenanceWithConsumption(
  user: User | null,
  maintenanceData: Omit<
    MachineMaintenanceRecord,
    'id' | 'createdAt' | 'updatedAt'
  >,
  consumptions: ConsumptionLineInput[],
  financial?: IntegratedFinancialInput,
): CreateMachineMaintenanceWithConsumptionResult {
  requirePermissions(user, ['machines', 'inventory'])

  if (consumptions.length === 0) {
    throw new Error('Informe ao menos um item para baixa.')
  }

  validateIntegratedMovementsBatch(
    consumptions,
    maintenanceData.maintenanceDate,
    {
      module: 'machines',
      type: 'machine-maintenance',
      recordId: '__pre__',
    },
    maintenanceData.responsible,
    'Baixa por manutenção de máquina',
  )

  if (financial) {
    preflightIntegratedFinancial(user, financial, {
      module: 'machines',
      type: 'machine-maintenance',
      recordId: '__pre__',
    })
  }

  const record = createMachineMaintenanceRecord(maintenanceData)

  let movements: InventoryMovement[]

  try {
    movements = createInventoryMovementsBatch(
      consumptions.map(line => ({
        inventoryItemId: line.inventoryItemId,
        type: 'Saída' as const,
        movementDate: record.maintenanceDate,
        quantity: line.quantity,
        reason: 'Baixa por manutenção de máquina',
        responsible: record.responsible,
        notes: undefined,
        origin: {
          module: 'machines' as const,
          type: 'machine-maintenance' as const,
          recordId: record.id,
        },
      })),
    )
  } catch (movementError) {
    let rolledBack = false
    let rollbackError: unknown = null

    try {
      rolledBack = deleteMachineMaintenanceRecord(record.id)
    } catch (error) {
      rollbackError = error
    }

    if (rollbackError !== null) {
      throw new Error(
        'Falha parcial: as movimentações de estoque não puderam ser registradas e o rollback da manutenção também falhou. Verifique o estoque e a manutenção manualmente.',
      )
    }

    if (!rolledBack) {
      throw new Error(
        'Falha parcial: as movimentações de estoque não puderam ser registradas e o rollback da manutenção não removeu o registro. Verifique o estoque e a manutenção manualmente.',
      )
    }

    throw movementError
  }

  if (!financial) {
    return { record, movements }
  }

  try {
    const financialTransaction = createFinancialTransactionWithOrigin(
      user,
      financial,
      {
        module: 'machines',
        type: 'machine-maintenance',
        recordId: record.id,
      },
    )

    return { record, movements, financialTransaction }
  } catch {
    throw buildPostPersistenceFinancialError()
  }
}

// -------------------- Entrada de estoque → Financeiro --------------------

export interface CreateInventoryMovementWithFinancialResult {
  movement: InventoryMovement
  financialTransaction?: FinancialTransaction
}

export function createInventoryMovementWithFinancial(
  user: User | null,
  movementInput: Omit<
    InventoryMovement,
    | 'id'
    | 'createdAt'
    | 'balanceBefore'
    | 'balanceAfter'
    | 'itemCodeSnapshot'
    | 'itemNameSnapshot'
    | 'unitSnapshot'
  >,
  financial?: IntegratedFinancialInput,
): CreateInventoryMovementWithFinancialResult {
  requirePermissions(user, ['inventory'])

  if (financial) {
    requirePermissions(user, ['finance'])
  }

  if (financial && movementInput.type !== 'Entrada') {
    throw new Error(
      'Somente entradas de estoque podem gerar lançamento financeiro por integração.',
    )
  }

  const movement = createInventoryMovement(movementInput)

  if (!financial) {
    return { movement }
  }

  preflightIntegratedFinancial(user, financial, {
    module: 'inventory',
    type: 'inventory-entry',
    recordId: movement.id,
  })

  try {
    const financialTransaction = createFinancialTransactionWithOrigin(
      user,
      financial,
      {
        module: 'inventory',
        type: 'inventory-entry',
        recordId: movement.id,
      },
    )

    return { movement, financialTransaction }
  } catch {
    throw new Error(
      'A movimentação de estoque foi salva, mas o lançamento financeiro não pôde ser criado. Verifique o Financeiro manualmente.',
    )
  }
}