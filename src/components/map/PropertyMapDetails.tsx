import { Link } from 'react-router-dom'
import { LandArea } from '../../types'
import Card from '../ui/Card'
import LandAreaStatusBadge from '../land/LandAreaStatusBadge'
import CropCycleStatusBadge from '../crops/CropCycleStatusBadge'
import { ExternalLink, X } from 'lucide-react'
import { getRuralStructuresByLandAreaId } from '../../services/ruralStructureService'
import {
  getActiveOccupationByLandAreaId,
  getAnimalsInPaddockOccupation,
  getCurrentOccupationDays,
} from '../../services/paddockOccupationService'
import { getLotById } from '../../services/lotService'
import { getCropCyclesByLandAreaId } from '../../services/cropService'
import { getAnimalsByLandAreaId } from '../../services/animalService'
import { getMachineUsageRecordsByLandAreaId } from '../../services/machineUsageService'
import { getCropManagementsByLandAreaId } from '../../services/cropManagementService'
import { getMachineById } from '../../services/machineService'
import {
  calculateGeographicAreaHectares,
  getLandAreaGeographicBoundary,
  hectaresToSquareMeters,
} from '../../services/propertyMapService'

interface Props {
  area: LandArea | null
  canSeeLandDetails: boolean
  canSeeCrops: boolean
  canSeeAnimals: boolean
  canSeeMachines: boolean
  onClose: () => void
}

function formatHectares(value: number, digits = 2): string {
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + ' ha'
  )
}

function formatSquareMeters(value: number): string {
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' m²'
  )
}

export default function PropertyMapDetails({
  area,
  canSeeLandDetails,
  canSeeCrops,
  canSeeAnimals,
  canSeeMachines,
  onClose,
}: Props) {
  if (!area) {
    return (
      <Card className="p-4 text-sm text-gray-600 dark:text-gray-400">
        Selecione uma área no mapa para visualizar as informações.
      </Card>
    )
  }

  const structures = canSeeLandDetails
    ? getRuralStructuresByLandAreaId(area.id)
    : []

  const activeOccupation =
    canSeeLandDetails && area.type === 'Piquete'
      ? getActiveOccupationByLandAreaId(area.id)
      : undefined

  const occupationLot = activeOccupation
    ? getLotById(activeOccupation.lotId)
    : undefined

  const occupationAnimals = activeOccupation
    ? getAnimalsInPaddockOccupation(activeOccupation)
    : []

  const occupationDays = activeOccupation
    ? getCurrentOccupationDays(activeOccupation)
    : 0

  const cropCycles =
    canSeeCrops && area.type === 'Talhão'
      ? getCropCyclesByLandAreaId(area.id)
      : []

  const cropManagements =
    canSeeCrops && area.type === 'Talhão'
      ? getCropManagementsByLandAreaId(area.id).slice(0, 5)
      : []

  const associatedAnimals = canSeeAnimals
    ? getAnimalsByLandAreaId(area.id)
    : []

  const machineUsages = canSeeMachines
    ? getMachineUsageRecordsByLandAreaId(area.id)
        .sort((a, b) => b.operationDate.localeCompare(a.operationDate))
        .slice(0, 5)
    : []

  const geoBoundary = getLandAreaGeographicBoundary(area.id)

  const demarcatedArea = geoBoundary
    ? calculateGeographicAreaHectares(geoBoundary.points)
    : null

  const areaDiff =
    demarcatedArea !== null
      ? Math.abs(area.areaHectares - demarcatedArea)
      : null

  const registeredAreaM2 = hectaresToSquareMeters(area.areaHectares)

  const demarcatedAreaM2 =
    demarcatedArea !== null
      ? hectaresToSquareMeters(demarcatedArea)
      : null

  const areaDiffM2 =
    areaDiff !== null
      ? hectaresToSquareMeters(areaDiff)
      : null

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {area.code}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {area.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel da área"
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tipo
          </p>

          <p className="font-medium">
            {area.type}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Área cadastrada
          </p>

          <p className="font-medium">
            {formatHectares(area.areaHectares)}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatSquareMeters(registeredAreaM2)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Situação
          </p>

          <LandAreaStatusBadge status={area.status} />
        </div>

        {area.purpose && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Finalidade
            </p>

            <p>{area.purpose}</p>
          </div>
        )}

        {area.description && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Descrição
            </p>

            <p>{area.description}</p>
          </div>
        )}
      </div>

      {demarcatedArea !== null &&
        areaDiff !== null &&
        demarcatedAreaM2 !== null &&
        areaDiffM2 !== null && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3 text-sm">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Demarcação no satélite
            </p>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Área cadastrada
              </p>

              <p className="font-medium">
                {formatHectares(area.areaHectares)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatSquareMeters(registeredAreaM2)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Área demarcada
              </p>

              <p className="font-medium">
                {formatHectares(demarcatedArea)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatSquareMeters(demarcatedAreaM2)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Diferença
              </p>

              <p className="font-medium">
                {formatHectares(areaDiff)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatSquareMeters(areaDiffM2)}
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              A área demarcada é uma estimativa por satélite. Não substitui
              levantamento topográfico ou georreferenciamento certificado.
            </p>
          </div>
        )}

      {canSeeLandDetails && (
        <Link
          to={`/terras/${area.id}`}
          className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
        >
          Ver detalhes da área
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )}

      {canSeeLandDetails && area.type === 'Piquete' && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ocupação atual
          </p>

          {activeOccupation ? (
            <>
              <p className="text-sm">
                {occupationLot?.name ?? 'Lote não encontrado'}
              </p>

              <p className="text-xs text-gray-600 dark:text-gray-400">
                Animais: {occupationAnimals.length} · Dias de ocupação:{' '}
                {occupationDays}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Piquete livre
            </p>
          )}
        </div>
      )}

      {canSeeAnimals && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Animais associados a esta área
          </p>

          {associatedAnimals.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhum animal associado diretamente a esta área.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {associatedAnimals.slice(0, 8).map(animal => (
                <li key={animal.id}>
                  <Link
                    to={`/animais/${animal.id}`}
                    className="text-green-600 hover:underline"
                  >
                    {animal.identification}
                    {animal.name ? ` — ${animal.name}` : ''}
                  </Link>
                </li>
              ))}

              {associatedAnimals.length > 8 && (
                <li className="text-xs text-gray-500 dark:text-gray-400">
                  +{associatedAnimals.length - 8} animal(is)
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {canSeeCrops &&
        area.type === 'Talhão' &&
        cropCycles.length > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cultivos no talhão
            </p>

            <ul className="space-y-2">
              {cropCycles.slice(0, 3).map(cycle => (
                <li
                  key={cycle.id}
                  className="text-sm space-y-1"
                >
                  <p className="font-medium">
                    {cycle.crop}
                    {cycle.cultivar
                      ? ` — ${cycle.cultivar}`
                      : ''}
                  </p>

                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Safra: {cycle.season}
                  </p>

                  <CropCycleStatusBadge status={cycle.status} />
                </li>
              ))}
            </ul>
          </div>
        )}

      {canSeeCrops && cropManagements.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Manejos recentes
          </p>

          <ul className="space-y-1 text-sm">
            {cropManagements.map(management => (
              <li key={management.id}>
                <Link
                  to={`/cultivos/manejos/${management.id}`}
                  className="text-green-600 hover:underline"
                >
                  {management.date} — {management.type}:{' '}
                  {management.description}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canSeeMachines && machineUsages.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Utilização recente de máquinas
          </p>

          <ul className="space-y-1 text-sm">
            {machineUsages.map(usage => {
              const machine = getMachineById(usage.machineId)

              return (
                <li key={usage.id}>
                  {usage.operationDate} —{' '}
                  {machine
                    ? `${machine.code} — ${machine.name}`
                    : 'Máquina'}{' '}
                  ({usage.operationType}, {usage.workedHours}h)
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {canSeeLandDetails && structures.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estruturas vinculadas
          </p>

          <ul className="space-y-1 text-sm">
            {structures.map(structure => (
              <li key={structure.id}>
                {structure.code} — {structure.name}{' '}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({structure.type})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}