import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import {
  Animal,
  AnimalSex,
  AnimalSpecies,
  AnimalCategory,
  AnimalStatus,
  LandArea,
  Lot,
  User,
} from '../../types'
import { getLandAreas } from '../../services/landService'
import { userHasPermission } from '../../services/permissionService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface AnimalFormData {
  identification: string
  name: string
  species: AnimalSpecies
  breed: string
  sex: AnimalSex
  birthDate: string
  category: AnimalCategory
  status: AnimalStatus
  lotId: string
  landAreaId: string
  currentWeight: string
  origin: string
  notes: string
}

interface Props {
  animal?: Animal
  lots: Lot[]
  user: User | null
  onSubmit: (
    data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

const speciesOptions: AnimalSpecies[] = [
  'Bovino',
  'Bubalino',
  'Ovino',
  'Caprino',
  'Equino',
  'Suíno',
  'Outro',
]

const sexOptions: AnimalSex[] = ['Macho', 'Fêmea']

const categoryOptions: AnimalCategory[] = [
  'Bezerro',
  'Bezerra',
  'Novilho',
  'Novilha',
  'Vaca',
  'Touro',
  'Boi',
  'Matriz',
  'Reprodutor',
  'Outro',
]

const statusOptions: AnimalStatus[] = [
  'Ativo',
  'Vendido',
  'Morto',
  'Descartado',
  'Transferido',
]

const originOptions = [
  'Nascimento na propriedade',
  'Compra',
  'Transferência',
  'Outro',
]

export default function AnimalForm({
  animal,
  lots,
  user,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const canUseLand = userHasPermission(user, 'land')

  const availableLandAreas: LandArea[] = useMemo(() => {
    if (!canUseLand) return []

    return getLandAreas()
  }, [canUseLand])

  const [formData, setFormData] = useState<AnimalFormData>(() => {
    if (animal) {
      return {
        identification: animal.identification,
        name: animal.name ?? '',
        species: animal.species,
        breed: animal.breed,
        sex: animal.sex,
        birthDate: animal.birthDate ?? '',
        category: animal.category,
        status: animal.status,
        lotId: animal.lotId ?? '',
        landAreaId: animal.landAreaId ?? '',
        currentWeight: animal.currentWeight?.toString() ?? '',
        origin: animal.origin ?? '',
        notes: animal.notes ?? '',
      }
    }

    return {
      identification: '',
      name: '',
      species: 'Bovino',
      breed: '',
      sex: 'Macho',
      birthDate: '',
      category: 'Bezerro',
      status: 'Ativo',
      lotId: '',
      landAreaId: '',
      currentWeight: '',
      origin: originOptions[0],
      notes: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof AnimalFormData, string>>
  >({})

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof AnimalFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AnimalFormData, string>> = {}

    if (!formData.identification.trim()) {
      newErrors.identification = 'Identificação é obrigatória'
    }

    if (!formData.breed.trim()) {
      newErrors.breed = 'Raça é obrigatória'
    }

    if (!formData.species) {
      newErrors.species = 'Espécie é obrigatória'
    }

    if (!formData.sex) {
      newErrors.sex = 'Sexo é obrigatório'
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória'
    }

    if (formData.currentWeight) {
      const weight = parseFloat(formData.currentWeight)

      if (!Number.isFinite(weight) || weight <= 0) {
        newErrors.currentWeight = 'Peso deve ser um número maior que zero'
      }
    }

    if (formData.birthDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const birth = new Date(formData.birthDate + 'T00:00:00')

      if (birth > today) {
        newErrors.birthDate = 'Data de nascimento não pode ser futura'
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const payload: Omit<
      Animal,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      identification: formData.identification.trim(),
      name: formData.name.trim() || undefined,
      species: formData.species,
      breed: formData.breed.trim(),
      sex: formData.sex,
      birthDate: formData.birthDate || undefined,
      category: formData.category,
      status: formData.status,
      lotId: formData.lotId || undefined,
      currentWeight: formData.currentWeight
        ? parseFloat(formData.currentWeight)
        : undefined,
      origin: formData.origin || undefined,
      notes: formData.notes.trim() || undefined,
    }

    if (canUseLand) {
      payload.landAreaId =
        formData.landAreaId || undefined
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Identificação *"
              name="identification"
              value={formData.identification}
              onChange={handleChange}
              placeholder="Ex: BR-0004"
              required
            />

            {errors.identification && (
              <p className="mt-1 text-sm text-red-600">
                {errors.identification}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome do animal (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Espécie *
            </label>

            <select
              name="species"
              value={formData.species}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {speciesOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.species && (
              <p className="mt-1 text-sm text-red-600">
                {errors.species}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Raça *"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="Ex: Nelore"
              required
            />

            {errors.breed && (
              <p className="mt-1 text-sm text-red-600">
                {errors.breed}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Sexo *
            </label>

            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {sexOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.sex && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sex}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data de nascimento"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleChange}
            />

            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.birthDate}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="animal-category"
                className="block text-sm font-medium"
              >
                Categoria *
              </label>

              <HelpTip
                title="O que é a categoria do animal?"
                description="É a classificação usada para organizar o animal dentro do rebanho."
              />
            </div>

            <select
              id="animal-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categoryOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="animal-lot"
                className="block text-sm font-medium"
              >
                Lote
              </label>

              <HelpTip
                title="O que é um lote de animais?"
                description="É um grupo de animais organizado em conjunto."
              />
            </div>

            <select
              id="animal-lot"
              name="lotId"
              value={formData.lotId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">
                Sem lote
              </option>

              {lots.map(lot => (
                <option
                  key={lot.id}
                  value={lot.id}
                >
                  {lot.name}
                </option>
              ))}
            </select>
          </div>

          {canUseLand && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label
                  htmlFor="animal-land-area"
                  className="block text-sm font-medium"
                >
                  Área / Piquete
                </label>

                <HelpTip
                  title="Para que serve a Área / Piquete?"
                  description="Associação administrativa opcional do animal a uma área ou piquete cadastrado em Terras."
                />
              </div>

              <select
                id="animal-land-area"
                name="landAreaId"
                value={formData.landAreaId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Sem área associada
                </option>

                {availableLandAreas.map(area => (
                  <option
                    key={area.id}
                    value={area.id}
                  >
                    {area.code} — {area.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Input
              label="Peso atual (kg)"
              name="currentWeight"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.currentWeight}
              onChange={handleChange}
              placeholder="0.0"
            />

            {errors.currentWeight && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currentWeight}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Origem
            </label>

            <select
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {originOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Situação *
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statusOptions.map(option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Observações
          </label>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
            placeholder="Informações adicionais (opcional)"
          />
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? 'Salvando...'
            : 'Salvar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}