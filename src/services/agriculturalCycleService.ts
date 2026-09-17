import {
  CropCycle,
  LandArea,
  SoilAnalysis,
  CropManagement,
  HarvestRecord,
} from '../types'
import { getCropCycles, getCropCycleById } from './cropService'
import { getLandAreaById } from './landService'
import { getSoilAnalysesByLandAreaId } from './soilAnalysisService'
import { getCropManagementsByCropCycleId } from './cropManagementService'
import {
  getHarvestRecordByCropCycleId,
  getHarvestProductionKg,
  getHarvestProductivityKgPerHectare,
} from './harvestService'

export interface AgriculturalCycleSummary {
  cropCycle: CropCycle
  landArea?: LandArea
  soilAnalyses: SoilAnalysis[]
  latestSoilAnalysis?: SoilAnalysis
  cropManagements: CropManagement[]
  harvestRecord?: HarvestRecord
  productionKg: number
  productivityKgPerHectare: number
}

export type AgriculturalCycleTimelineEventType =
  | 'Plantio'
  | 'Manejo'
  | 'Previsão de colheita'
  | 'Colheita'

export interface AgriculturalCycleTimelineEvent {
  id: string
  date: string
  type: AgriculturalCycleTimelineEventType
  title: string
  description?: string
}

function getLatestSoilAnalysis(
  soilAnalyses: SoilAnalysis[]
): SoilAnalysis | undefined {
  if (soilAnalyses.length === 0) return undefined

  return soilAnalyses.reduce((latest, current) => {
    if (current.sampleDate > latest.sampleDate) return current
    return latest
  }, soilAnalyses[0])
}

export function getAgriculturalCycleSummaries(): AgriculturalCycleSummary[] {
  const cropCycles = getCropCycles()

  return cropCycles.map(cropCycle => {
    const landArea = getLandAreaById(cropCycle.landAreaId)
    const soilAnalyses = landArea
      ? getSoilAnalysesByLandAreaId(landArea.id)
      : []
    const latestSoilAnalysis = getLatestSoilAnalysis(soilAnalyses)
    const cropManagements = getCropManagementsByCropCycleId(cropCycle.id)
    const harvestRecord = getHarvestRecordByCropCycleId(cropCycle.id)

    const productionKg = harvestRecord
      ? getHarvestProductionKg(harvestRecord)
      : 0

    const productivityKgPerHectare = harvestRecord
      ? getHarvestProductivityKgPerHectare(harvestRecord)
      : 0

    return {
      cropCycle,
      landArea,
      soilAnalyses,
      latestSoilAnalysis,
      cropManagements,
      harvestRecord,
      productionKg,
      productivityKgPerHectare,
    }
  })
}

export function getAgriculturalCycleSummaryByCropCycleId(
  cropCycleId: string
): AgriculturalCycleSummary | undefined {
  const cropCycle = getCropCycleById(cropCycleId)
  if (!cropCycle) return undefined

  return getAgriculturalCycleSummaries().find(
    summary => summary.cropCycle.id === cropCycle.id
  )
}

const TIMELINE_PRIORITY: Record<AgriculturalCycleTimelineEventType, number> = {
  Plantio: 1,
  Manejo: 2,
  'Previsão de colheita': 3,
  Colheita: 4,
}

export function getAgriculturalCycleTimeline(
  cropCycleId: string
): AgriculturalCycleTimelineEvent[] {
  const summary = getAgriculturalCycleSummaryByCropCycleId(cropCycleId)
  if (!summary) return []

  const events: AgriculturalCycleTimelineEvent[] = []

  const { cropCycle, cropManagements, harvestRecord } = summary

  if (cropCycle.plantingDate) {
    events.push({
      id: `planting-${cropCycle.id}`,
      date: cropCycle.plantingDate,
      type: 'Plantio',
      title: 'Plantio do cultivo',
      description: cropCycle.cultivar
        ? `${cropCycle.crop} — ${cropCycle.cultivar}`
        : cropCycle.crop,
    })
  }

  cropManagements.forEach(management => {
    events.push({
      id: `management-${management.id}`,
      date: management.date,
      type: 'Manejo',
      title: management.type,
      description: management.description,
    })
  })

  if (cropCycle.expectedHarvestDate) {
    events.push({
      id: `expected-harvest-${cropCycle.id}`,
      date: cropCycle.expectedHarvestDate,
      type: 'Previsão de colheita',
      title: 'Previsão de colheita',
    })
  }

  if (harvestRecord) {
    events.push({
      id: `harvest-${harvestRecord.id}`,
      date: harvestRecord.harvestDate,
      type: 'Colheita',
      title: 'Colheita realizada',
      description: `${harvestRecord.productionQuantity} ${harvestRecord.productionUnit}`,
    })
  }

  events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }

    return TIMELINE_PRIORITY[a.type] - TIMELINE_PRIORITY[b.type]
  })

  return events
}