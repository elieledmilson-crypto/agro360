import { useState, useMemo } from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import MachineUsageForm from '../../components/machines/MachineUsageForm'
import { createMachineUsageRecord } from '../../services/machineUsageService'
import { getMachineById } from '../../services/machineService'
import { getLandAreaById } from '../../services/landService'
import { getCropCycleById } from '../../services/cropService'
import { MachineUsageRecord } from '../../types'
import HelpTip from '../../components/ui/HelpTip'

export default function NewMachineUsagePage() {
  const navigate = useNavigate()
  const [searchParams] =
    useSearchParams()

  const preselectedValues =
    useMemo(() => {
      const requestedMachineId =
        searchParams.get(
          'machineId'
        ) ?? ''

      const requestedLandAreaId =
        searchParams.get(
          'landAreaId'
        ) ?? ''

      const requestedCropCycleId =
        searchParams.get(
          'cropCycleId'
        ) ?? ''

      let selectedMachineId:
        | string
        | undefined

      let selectedLandAreaId:
        | string
        | undefined

      let selectedCropCycleId:
        | string
        | undefined

      const machine =
        requestedMachineId
          ? getMachineById(
              requestedMachineId
            )
          : undefined

      if (machine) {
        selectedMachineId =
          machine.id
      }

      const cropCycle =
        requestedCropCycleId
          ? getCropCycleById(
              requestedCropCycleId
            )
          : undefined

      if (cropCycle) {
        selectedCropCycleId =
          cropCycle.id

        selectedLandAreaId =
          cropCycle.landAreaId
      } else {
        const landArea =
          requestedLandAreaId
            ? getLandAreaById(
                requestedLandAreaId
              )
            : undefined

        if (
          landArea &&
          landArea.type === 'Talhão'
        ) {
          selectedLandAreaId =
            landArea.id
        }
      }

      return {
        machineId:
          selectedMachineId,
        landAreaId:
          selectedLandAreaId,
        cropCycleId:
          selectedCropCycleId,
      }
    }, [searchParams])

  const [submitting, setSubmitting] =
    useState(false)

  const [submitError, setSubmitError] =
    useState('')

  const handleSubmit = (
    data: Omit<
      MachineUsageRecord,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const record =
        createMachineUsageRecord(
          data
        )

      navigate(
        `/maquinas/utilizacoes/${record.id}`,
        {
          state: {
            successMessage:
              'Registro de utilização cadastrado com sucesso.',
          },
        }
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar utilização.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            Nova Utilização Operacional
          </h1>

          <HelpTip
            title="O que devo fazer aqui?"
            description="Registre onde uma máquina foi utilizada, qual operação realizou, o talhão atendido e quantas horas trabalhou."
          />
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Registre a utilização de uma máquina ou equipamento.
        </p>
      </div>

      <MachineUsageForm
        preselectedMachineId={
          preselectedValues.machineId
        }
        preselectedLandAreaId={
          preselectedValues.landAreaId
        }
        preselectedCropCycleId={
          preselectedValues.cropCycleId
        }
        onSubmit={handleSubmit}
        onCancel={() =>
          navigate(
            '/maquinas/utilizacoes'
          )
        }
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  )
}