// Execução de ações assistidas do Assistente Agro360.
//
// IMPORTANTE:
// - NUNCA acessa armazenamento do navegador diretamente.
// - Sempre utiliza os services oficiais do módulo correspondente.
// - Revalida permissão no momento da execução (defense in depth).
// - Retorna sucesso apenas quando o service oficial retornar sucesso.
//
// A barreira de autorização local é determinística e reside em
// getIntelligenceActionPermissionError. Ela é usada:
//   1. ANTES de criar pendingAction no IntelligenceChat
//   2. ANTES de executar de fato em executeIntelligenceAction
// Assim, nem o card de confirmação nem os getters legíveis são
// acionados para ações não autorizadas.
//
// Observação técnica: as ações de escrita deverão ser revalidadas
// server-side quando o backend tiver banco/autenticação.

import {
  AgendaActivity,
  Animal,
  CreateAgendaActivityActionData,
  CreateAnimalActionData,
  CreateCropCycleActionData,
  CreateFinancialTransactionActionData,
  CreateInventoryMovementActionData,
  CreateLandAreaActionData,
  CropCycle,
  FinancialTransaction,
  IntelligenceActionProposal,
  InventoryMovement,
  LandArea,
  Machine,
  UpdateMachineStatusActionData,
  User,
} from '../types'
import {
  userHasPermission,
} from './permissionService'
import {
  createLandArea,
  getLandAreaById,
} from './landService'
import {
  createAnimal,
} from './animalService'
import {
  createAgendaActivity,
} from './agendaService'
import {
  createFinancialTransaction,
  getFinancialCategoryById,
} from './financeService'
import {
  createInventoryMovement,
  getInventoryItemById,
} from './inventoryService'
import {
  createCropCycle,
} from './cropService'
import {
  getMachines,
  updateMachine,
} from './machineService'

export interface IntelligenceActionResult {
  success: boolean
  message: string
}

export function getIntelligenceActionPermissionError(
  user: User | null,
  proposal:
    IntelligenceActionProposal,
): string | null {
  if (!user) {
    return 'Usuário não autenticado.'
  }

  if (
    !userHasPermission(
      user,
      'intelligence',
    )
  ) {
    return 'Você não possui permissão para usar o Assistente Agro360.'
  }

  switch (proposal.type) {
    case 'create_land_area': {
      if (
        !userHasPermission(
          user,
          'land',
        )
      ) {
        return 'Você não possui permissão para criar registros de Terras.'
      }

      return null
    }

    case 'create_animal': {
      if (
        !userHasPermission(
          user,
          'animals',
        )
      ) {
        return 'Você não possui permissão para criar registros de Animais.'
      }

      return null
    }

    case 'create_agenda_activity': {
      if (
        !userHasPermission(
          user,
          'agenda',
        )
      ) {
        return 'Você não possui permissão para criar registros de Agenda.'
      }

      return null
    }

    case 'create_financial_transaction': {
      if (
        !userHasPermission(
          user,
          'finance',
        )
      ) {
        return 'Você não possui permissão para criar registros de Financeiro.'
      }

      return null
    }

    case 'create_inventory_movement': {
      if (
        !userHasPermission(
          user,
          'inventory',
        )
      ) {
        return 'Você não possui permissão para criar registros de Estoque.'
      }

      return null
    }

    case 'create_crop_cycle': {
      if (
        !userHasPermission(
          user,
          'crops',
        )
      ) {
        return 'Você não possui permissão para criar registros de Cultivos.'
      }

      if (
        !userHasPermission(
          user,
          'land',
        )
      ) {
        return 'Você não possui permissão para criar registros de Terras.'
      }

      return null
    }

    case 'update_machine_status': {
      if (
        !userHasPermission(
          user,
          'machines',
        )
      ) {
        return 'Você não possui permissão para alterar registros de Máquinas.'
      }

      return null
    }
  }
}

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}$/

const HHMM_RE =
  /^([01]\d|2[0-3]):[0-5]\d$/

const DAYS_IN_MONTH = [
  31,
  28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31,
]

function isLeapYear(
  year: number,
): boolean {
  return (
    year % 400 === 0 ||
    (
      year % 4 === 0 &&
      year % 100 !== 0
    )
  )
}

function isValidCivilDate(
  value: string,
): boolean {
  if (
    !ISO_DATE_RE.test(value)
  ) {
    return false
  }

  const year =
    Number(
      value.slice(0, 4),
    )

  const month =
    Number(
      value.slice(5, 7),
    )

  const day =
    Number(
      value.slice(8, 10),
    )

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false
  }

  if (
    month < 1 ||
    month > 12
  ) {
    return false
  }

  if (day < 1) {
    return false
  }

  const maxDay =
    month === 2 &&
    isLeapYear(year)
      ? 29
      : DAYS_IN_MONTH[
          month - 1
        ]

  return day <= maxDay
}

function isValidTime(
  value: string,
): boolean {
  return HHMM_RE.test(value)
}

function trimOrUndefined(
  value: unknown,
): string | undefined {
  if (
    typeof value !== 'string'
  ) {
    return undefined
  }

  const trimmed =
    value.trim()

  return trimmed.length > 0
    ? trimmed
    : undefined
}

function safeErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message
  }

  return 'erro inesperado'
}

function runCreateLandArea(
  data:
    CreateLandAreaActionData,
): IntelligenceActionResult {
  if (
    !data.code ||
    data.code.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O código é obrigatório.',
    }
  }

  if (
    !data.name ||
    data.name.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O nome é obrigatório.',
    }
  }

  if (
    !Number.isFinite(
      data.areaHectares,
    ) ||
    data.areaHectares <= 0
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A área deve ser um número maior que zero.',
    }
  }

  try {
    const payload:
      Omit<
        LandArea,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      > = {
        code:
          data.code.trim(),
        name:
          data.name.trim(),
        type:
          data.type,
        areaHectares:
          data.areaHectares,
        purpose:
          trimOrUndefined(
            data.purpose,
          ),
        status:
          data.status,
        description:
          trimOrUndefined(
            data.description,
          ),
      }

    const created =
      createLandArea(
        payload,
      )

    return {
      success: true,
      message:
        `Área ${created.code} — ${created.name} criada com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível criar a área: ${safeErrorMessage(error)}.`,
    }
  }
}

function runCreateAnimal(
  data:
    CreateAnimalActionData,
): IntelligenceActionResult {
  if (
    !data.identification ||
    data.identification.trim() ===
      ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A identificação é obrigatória.',
    }
  }

  if (
    !data.breed ||
    data.breed.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A raça é obrigatória.',
    }
  }

  if (
    data.birthDate &&
    !isValidCivilDate(
      data.birthDate,
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Data de nascimento inválida.',
    }
  }

  if (
    data.currentWeight !==
      undefined &&
    data.currentWeight !==
      null &&
    (
      !Number.isFinite(
        data.currentWeight,
      ) ||
      data.currentWeight <= 0
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Peso deve ser maior que zero.',
    }
  }

  try {
    const payload:
      Omit<
        Animal,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      > = {
        identification:
          data.identification.trim(),
        name:
          trimOrUndefined(
            data.name,
          ),
        species:
          data.species,
        breed:
          data.breed.trim(),
        sex:
          data.sex,
        birthDate:
          trimOrUndefined(
            data.birthDate,
          ),
        category:
          data.category,
        status:
          data.status,
        lotId:
          trimOrUndefined(
            data.lotId,
          ),
        currentWeight:
          data.currentWeight !==
              undefined &&
            data.currentWeight !==
              null
            ? data.currentWeight
            : undefined,
        origin:
          trimOrUndefined(
            data.origin,
          ),
        notes:
          trimOrUndefined(
            data.notes,
          ),
      }

    const created =
      createAnimal(
        payload,
      )

    return {
      success: true,
      message:
        `Animal ${created.identification} criado com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível criar o animal: ${safeErrorMessage(error)}.`,
    }
  }
}

function runCreateAgendaActivity(
  data:
    CreateAgendaActivityActionData,
): IntelligenceActionResult {
  if (
    !data.title ||
    data.title.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O título é obrigatório.',
    }
  }

  if (
    !isValidCivilDate(
      data.date,
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Data da atividade inválida.',
    }
  }

  if (
    data.time !== undefined &&
    data.time !== null &&
    !isValidTime(data.time)
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Horário inválido.',
    }
  }

  try {
    const payload:
      Omit<
        AgendaActivity,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      > = {
        title:
          data.title.trim(),
        type:
          data.type,
        date:
          data.date,
        time:
          trimOrUndefined(
            data.time,
          ),
        priority:
          data.priority,
        status:
          data.status,
        responsibleEmployeeId:
          trimOrUndefined(
            data.responsibleEmployeeId,
          ),
        notes:
          trimOrUndefined(
            data.notes,
          ),
      }

    const created =
      createAgendaActivity(
        payload,
      )

    return {
      success: true,
      message:
        `Atividade "${created.title}" criada com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível criar a atividade: ${safeErrorMessage(error)}.`,
    }
  }
}

function runCreateFinancialTransaction(
  data:
    CreateFinancialTransactionActionData,
): IntelligenceActionResult {
  if (
    !isValidCivilDate(
      data.date,
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Data inválida.',
    }
  }

  if (
    !data.categoryId ||
    data.categoryId.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A categoria é obrigatória.',
    }
  }

  if (
    !data.description ||
    data.description.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A descrição é obrigatória.',
    }
  }

  if (
    !Number.isFinite(
      data.amount,
    ) ||
    data.amount <= 0
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O valor deve ser maior que zero.',
    }
  }

  try {
    const payload:
      Omit<
        FinancialTransaction,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      > = {
        type:
          data.type,
        date:
          data.date,
        categoryId:
          data.categoryId.trim(),
        description:
          data.description.trim(),
        amount:
          data.amount,
        notes:
          trimOrUndefined(
            data.notes,
          ),
      }

    const created =
      createFinancialTransaction(
        payload,
      )

    const amountLabel =
      created.amount
        .toLocaleString(
          'pt-BR',
          {
            style:
              'currency',
            currency:
              'BRL',
          },
        )

    return {
      success: true,
      message:
        `Transação financeira (${created.type}) de ${amountLabel} registrada com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível registrar a transação: ${safeErrorMessage(error)}.`,
    }
  }
}

function runCreateInventoryMovement(
  data:
    CreateInventoryMovementActionData,
): IntelligenceActionResult {
  if (
    !data.inventoryItemId ||
    data.inventoryItemId.trim() ===
      ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O item é obrigatório.',
    }
  }

  if (
    !isValidCivilDate(
      data.movementDate,
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Data da movimentação inválida.',
    }
  }

  if (
    !Number.isFinite(
      data.quantity,
    ) ||
    data.quantity <= 0
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A quantidade deve ser maior que zero.',
    }
  }

  if (
    !data.reason ||
    data.reason.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O motivo é obrigatório.',
    }
  }

  try {
    const payload:
      Omit<
        InventoryMovement,
        | 'id'
        | 'createdAt'
        | 'balanceBefore'
        | 'balanceAfter'
      > = {
        inventoryItemId:
          data.inventoryItemId.trim(),
        type:
          data.type,
        movementDate:
          data.movementDate,
        quantity:
          data.quantity,
        reason:
          data.reason.trim(),
        responsible:
          trimOrUndefined(
            data.responsible,
          ),
        notes:
          trimOrUndefined(
            data.notes,
          ),
      }

    const created =
      createInventoryMovement(
        payload,
      )

    return {
      success: true,
      message:
        `Movimentação de ${created.type.toLowerCase()} registrada com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível registrar a movimentação: ${safeErrorMessage(error)}.`,
    }
  }
}

function runCreateCropCycle(
  data:
    CreateCropCycleActionData,
): IntelligenceActionResult {
  if (
    !data.landAreaId ||
    data.landAreaId.trim() ===
      ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. O talhão é obrigatório.',
    }
  }

  if (
    !data.crop ||
    data.crop.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A cultura é obrigatória.',
    }
  }

  if (
    !data.season ||
    data.season.trim() === ''
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. A safra é obrigatória.',
    }
  }

  if (
    data.plantingDate &&
    !isValidCivilDate(
      data.plantingDate,
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Data de plantio inválida.',
    }
  }

  if (
    data.expectedHarvestDate &&
    !isValidCivilDate(
      data.expectedHarvestDate,
    )
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Data de colheita prevista inválida.',
    }
  }

  try {
    const payload:
      Omit<
        CropCycle,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      > = {
        landAreaId:
          data.landAreaId.trim(),
        crop:
          data.crop.trim(),
        cultivar:
          trimOrUndefined(
            data.cultivar,
          ),
        season:
          data.season.trim(),
        status:
          data.status,
        plantingDate:
          trimOrUndefined(
            data.plantingDate,
          ),
        expectedHarvestDate:
          trimOrUndefined(
            data.expectedHarvestDate,
          ),
        notes:
          trimOrUndefined(
            data.notes,
          ),
      }

    const created =
      createCropCycle(
        payload,
      )

    return {
      success: true,
      message:
        `Ciclo de cultivo de ${created.crop} (${created.season}) criado com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível criar o ciclo: ${safeErrorMessage(error)}.`,
    }
  }
}

function runUpdateMachineStatus(
  data:
    UpdateMachineStatusActionData,
): IntelligenceActionResult {
  const code =
    data.machineCode.trim()

  if (!code) {
    return {
      success: false,
      message:
        'Nada foi alterado. O código é obrigatório.',
    }
  }

  const all =
    getMachines()

  const normalized =
    code.toLowerCase()

  const matches =
    all.filter(
      machine =>
        machine.code
          .toLowerCase() ===
        normalized,
    )

  if (
    matches.length === 0
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Máquina não encontrada pelo código informado.',
    }
  }

  if (
    matches.length > 1
  ) {
    return {
      success: false,
      message:
        'Nada foi alterado. Mais de uma máquina corresponde a esse código.',
    }
  }

  const target =
    matches[0]

  if (
    target.status ===
    data.newStatus
  ) {
    return {
      success: true,
      message:
        `A máquina ${target.code} já está com situação "${data.newStatus}".`,