// Execução de ações assistidas do Assistente Agro360.
//
// IMPORTANTE:
// - NUNCA acessa localStorage diretamente.
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
    }
  }

  try {
    const fullInput:
      Omit<
        Machine,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      > = {
        code:
          target.code,
        name:
          target.name,
        category:
          target.category,
        brand:
          target.brand,
        model:
          target.model,
        year:
          target.year,
        identification:
          target.identification,
        hourMeter:
          target.hourMeter,
        status:
          data.newStatus,
        notes:
          target.notes,
      }

    const updated =
      updateMachine(
        target.id,
        fullInput,
      )

    if (!updated) {
      return {
        success: false,
        message:
          'Nada foi alterado. Não foi possível atualizar a máquina.',
      }
    }

    return {
      success: true,
      message:
        `Máquina ${updated.code} atualizada para "${updated.status}" com sucesso.`,
    }
  } catch (error) {
    return {
      success: false,
      message:
        `Nada foi alterado. Não foi possível atualizar a máquina: ${safeErrorMessage(error)}.`,
    }
  }
}

export function executeIntelligenceAction(
  user: User | null,
  proposal:
    IntelligenceActionProposal,
): IntelligenceActionResult {
  const permissionError =
    getIntelligenceActionPermissionError(
      user,
      proposal,
    )

  if (permissionError) {
    return {
      success: false,
      message:
        permissionError,
    }
  }

  switch (proposal.type) {
    case 'create_land_area':
      return runCreateLandArea(
        proposal.data,
      )

    case 'create_animal':
      return runCreateAnimal(
        proposal.data,
      )

    case 'create_agenda_activity':
      return runCreateAgendaActivity(
        proposal.data,
      )

    case 'create_financial_transaction':
      return runCreateFinancialTransaction(
        proposal.data,
      )

    case 'create_inventory_movement':
      return runCreateInventoryMovement(
        proposal.data,
      )

    case 'create_crop_cycle':
      return runCreateCropCycle(
        proposal.data,
      )

    case 'update_machine_status':
      return runUpdateMachineStatus(
        proposal.data,
      )
  }
}

export interface ActionFieldDescriptor {
  label: string
  value: string
}

export interface ActionDescriptor {
  title: string
  moduleLabel: string
  fields:
    ActionFieldDescriptor[]
  warning: string
}

function safeString(
  value: unknown,
  fallback = '—',
): string {
  if (
    typeof value !== 'string'
  ) {
    return fallback
  }

  const trimmed =
    value.trim()

  return trimmed.length > 0
    ? trimmed
    : fallback
}

function safeFormatHectares(
  value: unknown,
): string {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return '0,00 ha'
  }

  return `${value.toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )} ha`
}

function safeFormatCurrency(
  value: unknown,
): string {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return 'R$ 0,00'
  }

  return value.toLocaleString(
    'pt-BR',
    {
      style:
        'currency',
      currency:
        'BRL',
    },
  )
}

function safeFormatQuantity(
  value: unknown,
  unit:
    string | undefined,
): string {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return unit
      ? `0 ${unit}`
      : '0'
  }

  return unit
    ? `${value} ${unit}`
    : String(value)
}

export function describeAction(
  proposal:
    IntelligenceActionProposal,
): ActionDescriptor {
  switch (proposal.type) {
    case 'create_land_area': {
      const data =
        proposal.data

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Código',
              value:
                safeString(
                  data.code,
                ),
            },
            {
              label:
                'Nome',
              value:
                safeString(
                  data.name,
                ),
            },
            {
              label:
                'Tipo',
              value:
                safeString(
                  data.type,
                ),
            },
            {
              label:
                'Área',
              value:
                safeFormatHectares(
                  data.areaHectares,
                ),
            },
            {
              label:
                'Situação',
              value:
                safeString(
                  data.status,
                ),
            },
          ]

      const purpose =
        safeString(
          data.purpose,
          '',
        )

      if (purpose) {
        fields.push({
          label:
            'Finalidade',
          value:
            purpose,
        })
      }

      const description =
        safeString(
          data.description,
          '',
        )

      if (description) {
        fields.push({
          label:
            'Descrição',
          value:
            description,
        })
      }

      return {
        title:
          'Criar área',
        moduleLabel:
          'Terras',
        fields,
        warning:
          'Nenhum registro é criado até você confirmar. Você poderá revisar o cadastro no módulo Terras após a confirmação.',
      }
    }

    case 'create_animal': {
      const data =
        proposal.data

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Identificação',
              value:
                safeString(
                  data.identification,
                ),
            },
          ]

      const name =
        safeString(
          data.name,
          '',
        )

      if (name) {
        fields.push({
          label: 'Nome',
          value: name,
        })
      }

      fields.push({
        label:
          'Espécie',
        value:
          safeString(
            data.species,
          ),
      })

      fields.push({
        label: 'Raça',
        value:
          safeString(
            data.breed,
          ),
      })

      fields.push({
        label: 'Sexo',
        value:
          safeString(
            data.sex,
          ),
      })

      const birth =
        safeString(
          data.birthDate,
          '',
        )

      if (birth) {
        fields.push({
          label:
            'Nascimento',
          value:
            birth,
        })
      }

      fields.push({
        label:
          'Categoria',
        value:
          safeString(
            data.category,
          ),
      })

      fields.push({
        label:
          'Situação',
        value:
          safeString(
            data.status,
          ),
      })

      if (
        typeof data.currentWeight ===
          'number' &&
        Number.isFinite(
          data.currentWeight,
        )
      ) {
        fields.push({
          label:
            'Peso atual',
          value:
            `${data.currentWeight} kg`,
        })
      }

      const origin =
        safeString(
          data.origin,
          '',
        )

      if (origin) {
        fields.push({
          label:
            'Origem',
          value:
            origin,
        })
      }

      return {
        title:
          'Criar animal',
        moduleLabel:
          'Animais',
        fields,
        warning:
          'Nenhum registro é criado até você confirmar. Você poderá revisar o cadastro no módulo Animais após a confirmação.',
      }
    }

    case 'create_agenda_activity': {
      const data =
        proposal.data

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Título',
              value:
                safeString(
                  data.title,
                ),
            },
            {
              label:
                'Tipo',
              value:
                safeString(
                  data.type,
                ),
            },
            {
              label:
                'Data',
              value:
                safeString(
                  data.date,
                ),
            },
          ]

      const time =
        safeString(
          data.time,
          '',
        )

      if (time) {
        fields.push({
          label: 'Hora',
          value: time,
        })
      }

      fields.push({
        label:
          'Prioridade',
        value:
          safeString(
            data.priority,
          ),
      })

      fields.push({
        label:
          'Situação',
        value:
          safeString(
            data.status,
          ),
      })

      const notes =
        safeString(
          data.notes,
          '',
        )

      if (notes) {
        fields.push({
          label: 'Notas',
          value: notes,
        })
      }

      return {
        title:
          'Criar atividade',
        moduleLabel:
          'Agenda',
        fields,
        warning:
          'Nenhum registro é criado até você confirmar. Você poderá revisar a atividade no módulo Agenda após a confirmação.',
      }
    }

    case 'create_financial_transaction': {
      const data =
        proposal.data

      const category =
        getFinancialCategoryById(
          data.categoryId,
        )

      const categoryLabel =
        category
          ? category.name
          : 'Categoria não encontrada'

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Tipo',
              value:
                safeString(
                  data.type,
                ),
            },
            {
              label:
                'Data',
              value:
                safeString(
                  data.date,
                ),
            },
            {
              label:
                'Categoria',
              value:
                categoryLabel,
            },
            {
              label:
                'Descrição',
              value:
                safeString(
                  data.description,
                ),
            },
            {
              label:
                'Valor',
              value:
                safeFormatCurrency(
                  data.amount,
                ),
            },
          ]

      const notes =
        safeString(
          data.notes,
          '',
        )

      if (notes) {
        fields.push({
          label: 'Notas',
          value: notes,
        })
      }

      return {
        title:
          'Registrar transação financeira',
        moduleLabel:
          'Financeiro',
        fields,
        warning:
          'Nenhum registro é criado até você confirmar. Você poderá revisar a transação no módulo Financeiro após a confirmação.',
      }
    }

    case 'create_inventory_movement': {
      const data =
        proposal.data

      const item =
        getInventoryItemById(
          data.inventoryItemId,
        )

      const itemLabel =
        item
          ? `${item.code} — ${item.name}`
          : 'Item não encontrado'

      const unit =
        item
          ? item.unit
          : undefined

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Item',
              value:
                itemLabel,
            },
            {
              label:
                'Tipo',
              value:
                safeString(
                  data.type,
                ),
            },
            {
              label:
                'Data',
              value:
                safeString(
                  data.movementDate,
                ),
            },
            {
              label:
                'Quantidade',
              value:
                safeFormatQuantity(
                  data.quantity,
                  unit,
                ),
            },
            {
              label:
                'Motivo',
              value:
                safeString(
                  data.reason,
                ),
            },
          ]

      const responsible =
        safeString(
          data.responsible,
          '',
        )

      if (responsible) {
        fields.push({
          label:
            'Responsável',
          value:
            responsible,
        })
      }

      const notes =
        safeString(
          data.notes,
          '',
        )

      if (notes) {
        fields.push({
          label: 'Notas',
          value: notes,
        })
      }

      return {
        title:
          'Registrar movimentação de estoque',
        moduleLabel:
          'Estoque',
        fields,
        warning:
          'Nenhum registro é criado até você confirmar. O service oficial do Estoque revalidará o saldo ao executar.',
      }
    }

    case 'create_crop_cycle': {
      const data =
        proposal.data

      const area =
        getLandAreaById(
          data.landAreaId,
        )

      const areaLabel =
        area
          ? `${area.code} — ${area.name}`
          : 'Área não encontrada'

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Talhão',
              value:
                areaLabel,
            },
            {
              label:
                'Cultura',
              value:
                safeString(
                  data.crop,
                ),
            },
          ]

      const cultivar =
        safeString(
          data.cultivar,
          '',
        )

      if (cultivar) {
        fields.push({
          label:
            'Cultivar',
          value:
            cultivar,
        })
      }

      fields.push({
        label:
          'Safra',
        value:
          safeString(
            data.season,
          ),
      })

      fields.push({
        label:
          'Situação',
        value:
          safeString(
            data.status,
          ),
      })

      const planting =
        safeString(
          data.plantingDate,
          '',
        )

      if (planting) {
        fields.push({
          label:
            'Plantio',
          value:
            planting,
        })
      }

      const harvest =
        safeString(
          data.expectedHarvestDate,
          '',
        )

      if (harvest) {
        fields.push({
          label:
            'Colheita prevista',
          value:
            harvest,
        })
      }

      const notes =
        safeString(
          data.notes,
          '',
        )

      if (notes) {
        fields.push({
          label:
            'Notas',
          value:
            notes,
        })
      }

      return {
        title:
          'Criar ciclo de cultivo',
        moduleLabel:
          'Cultivos',
        fields,
        warning:
          'Nenhum registro é criado até você confirmar. Você poderá revisar o ciclo no módulo Cultivos após a confirmação.',
      }
    }

    case 'update_machine_status': {
      const data =
        proposal.data

      const all =
        getMachines()

      const normalized =
        data.machineCode
          .trim()
          .toLowerCase()

      const machine =
        all.find(
          current =>
            current.code
              .toLowerCase() ===
            normalized,
        ) ?? null

      const machineLabel =
        machine
          ? `${machine.code} — ${machine.name}`
          : `Máquina não encontrada (código ${safeString(data.machineCode)})`

      const currentStatus =
        machine
          ? machine.status
          : '—'

      const fields:
        ActionFieldDescriptor[] =
          [
            {
              label:
                'Máquina',
              value:
                machineLabel,
            },
            {
              label:
                'Situação atual',
              value:
                currentStatus,
            },
            {
              label:
                'Nova situação',
              value:
                safeString(
                  data.newStatus,
                ),
            },
          ]

      return {
        title:
          'Alterar situação da máquina',
        moduleLabel:
          'Máquinas',
        fields,
        warning:
          'Nenhum registro é alterado até você confirmar. Somente o campo de situação será modificado, preservando todos os demais dados da máquina.',
      }
    }
  }
}