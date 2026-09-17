import { useState, useMemo } from 'react'
import { getLandAreas } from '../../services/landService'
import { getLots } from '../../services/lotService'
import { getActivePaddockOccupations } from '../../services/paddockOccupationService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface Props {
  onSubmit: (data: {
    landAreaId: string
    lotId: string
    entryDate: string
    notes?: string
  }) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

export default function PaddockOccupationForm({
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [landAreaId, setLandAreaId] = useState('')
  const [lotId, setLotId] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const piquetes = useMemo(
    () =>
      getLandAreas().filter(
        area => area.type === 'Piquete'
      ),
    []
  )

  const lots = useMemo(
    () => getLots(),
    []
  )

  const activeOccupations = useMemo(
    () => getActivePaddockOccupations(),
    []
  )

  const unavailablePiqueteIds =
    new Set(
      activeOccupations.map(
        occ => occ.landAreaId
      )
    )

  const unavailableLotIds =
    new Set(
      activeOccupations.map(
        occ => occ.lotId
      )
    )

  const validate = () => {
    const newErrors: Record<
      string,
      string
    > = {}

    if (!landAreaId) {
      newErrors.landAreaId =
        'Piquete é obrigatório'
    }

    if (!lotId) {
      newErrors.lotId =
        'Lote é obrigatório'
    }

    if (!entryDate) {
      newErrors.entryDate =
        'Data de entrada é obrigatória'
    }

    setErrors(newErrors)

    return (
      Object.keys(newErrors).length ===
      0
    )
  }

  const handleSubmit = () => {
    if (!validate()) return

    onSubmit({
      landAreaId,
      lotId,
      entryDate,
      notes:
        notes.trim() || undefined,
    })
  }

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label
              htmlFor="occupation-land-area"
              className="block text-sm font-medium"
            >
              Piquete *
            </label>

            <HelpTip
              title="O que é um piquete?"
              description="É uma área cercada usada principalmente para organizar o pastejo e a movimentação dos animais dentro da propriedade."
            />
          </div>

          <select
            id="occupation-land-area"
            value={landAreaId}
            onChange={e =>
              setLandAreaId(
                e.target.value
              )
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Selecione um piquete
            </option>

            {piquetes.map(area => {
              const occupied =
                unavailablePiqueteIds.has(
                  area.id
                )

              const unavailableStatus =
                area.status === 'Inativa' ||
                area.status ===
                  'Em recuperação'

              const disabled =
                occupied ||
                unavailableStatus

              const reason = occupied
                ? 'Ocupado'
                : unavailableStatus
                  ? area.status
                  : ''

              return (
                <option
                  key={area.id}
                  value={area.id}
                  disabled={disabled}
                >
                  {area.code} —{' '}
                  {area.name}{' '}
                  {reason
                    ? `(${reason})`
                    : ''}
                </option>
              )
            })}
          </select>

          {errors.landAreaId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.landAreaId}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <label
              htmlFor="occupation-lot"
              className="block text-sm font-medium"
            >
              Lote *
            </label>

            <HelpTip
              title="O que é um lote de animais?"
              description="É um grupo de animais organizado em conjunto para facilitar o manejo, o acompanhamento e a movimentação do rebanho."
            />
          </div>

          <select
            id="occupation-lot"
            value={lotId}
            onChange={e =>
              setLotId(e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              Selecione um lote
            </option>

            {lots.map(lot => (
              <option
                key={lot.id}
                value={lot.id}
                disabled={unavailableLotIds.has(
                  lot.id
                )}
              >
                {lot.name}{' '}
                {unavailableLotIds.has(
                  lot.id
                )
                  ? '(já alocado)'
                  : ''}
              </option>
            ))}
          </select>

          {errors.lotId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.lotId}
            </p>
          )}
        </div>

        <div>
          <Input
            label="Data de entrada *"
            type="date"
            value={entryDate}
            onChange={e =>
              setEntryDate(
                e.target.value
              )
            }
            required
          />

          {errors.entryDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.entryDate}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>

          <textarea
            value={notes}
            onChange={e =>
              setNotes(e.target.value)
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Observações opcionais"
          />
        </div>
      </div>

      {submitError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {submitError}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? 'Salvando...'
            : 'Salvar'}
        </Button>

        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  )
}