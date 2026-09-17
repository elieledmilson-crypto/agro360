import { useState, FormEvent, ChangeEvent, useMemo } from 'react'
import { SoilAnalysis } from '../../types'
import { getLandAreas } from '../../services/landService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import HelpTip from '../ui/HelpTip'

interface SoilAnalysisFormData {
  landAreaId: string
  sampleDate: string
  laboratory: string
  sampleCode: string
  sampleDepth: string
  ph: string
  organicMatter: string
  phosphorus: string
  potassium: string
  calcium: string
  magnesium: string
  aluminum: string
  cec: string
  baseSaturation: string
  aluminumSaturation: string
  notes: string
}

interface Props {
  analysis?: SoilAnalysis
  onSubmit: (
    data: Omit<SoilAnalysis, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  onCancel: () => void
  submitting?: boolean
  submitError?: string
}

export default function SoilAnalysisForm({
  analysis,
  onSubmit,
  onCancel,
  submitting,
  submitError,
}: Props) {
  const [formData, setFormData] = useState<SoilAnalysisFormData>(() => {
    if (analysis) {
      return {
        landAreaId: analysis.landAreaId,
        sampleDate: analysis.sampleDate,
        laboratory: analysis.laboratory ?? '',
        sampleCode: analysis.sampleCode ?? '',
        sampleDepth: analysis.sampleDepth ?? '',
        ph: analysis.ph?.toString() ?? '',
        organicMatter: analysis.organicMatter?.toString() ?? '',
        phosphorus: analysis.phosphorus?.toString() ?? '',
        potassium: analysis.potassium?.toString() ?? '',
        calcium: analysis.calcium?.toString() ?? '',
        magnesium: analysis.magnesium?.toString() ?? '',
        aluminum: analysis.aluminum?.toString() ?? '',
        cec: analysis.cec?.toString() ?? '',
        baseSaturation: analysis.baseSaturation?.toString() ?? '',
        aluminumSaturation: analysis.aluminumSaturation?.toString() ?? '',
        notes: analysis.notes ?? '',
      }
    }

    return {
      landAreaId: '',
      sampleDate: '',
      laboratory: '',
      sampleCode: '',
      sampleDepth: '',
      ph: '',
      organicMatter: '',
      phosphorus: '',
      potassium: '',
      calcium: '',
      magnesium: '',
      aluminum: '',
      cec: '',
      baseSaturation: '',
      aluminumSaturation: '',
      notes: '',
    }
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof SoilAnalysisFormData, string>>
  >({})

  const talhoes = useMemo(
    () =>
      getLandAreas().filter(
        area => area.type === 'Talhão'
      ),
    []
  )

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof SoilAnalysisFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof SoilAnalysisFormData,
        string
      >
    > = {}

    if (!formData.landAreaId) {
      newErrors.landAreaId =
        'Talhão é obrigatório'
    }

    if (!formData.sampleDate) {
      newErrors.sampleDate =
        'Data da análise é obrigatória'
    }

    setErrors(newErrors)

    return (
      Object.keys(newErrors).length === 0
    )
  }

  const parseOptionalNumber = (
    value: string
  ): number | undefined => {
    const normalized = value.trim()

    if (!normalized) {
      return undefined
    }

    return Number(normalized)
  }

  const handleSubmit = (
    e: FormEvent
  ) => {
    e.preventDefault()

    if (!validate()) return

    const payload: Omit<
      SoilAnalysis,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      landAreaId:
        formData.landAreaId,
      sampleDate:
        formData.sampleDate,
      laboratory:
        formData.laboratory.trim() ||
        undefined,
      sampleCode:
        formData.sampleCode.trim() ||
        undefined,
      sampleDepth:
        formData.sampleDepth.trim() ||
        undefined,
      ph:
        parseOptionalNumber(formData.ph),
      organicMatter:
        parseOptionalNumber(formData.organicMatter),
      phosphorus:
        parseOptionalNumber(formData.phosphorus),
      potassium:
        parseOptionalNumber(formData.potassium),
      calcium:
        parseOptionalNumber(formData.calcium),
      magnesium:
        parseOptionalNumber(formData.magnesium),
      aluminum:
        parseOptionalNumber(formData.aluminum),
      cec:
        parseOptionalNumber(formData.cec),
      baseSaturation:
        parseOptionalNumber(formData.baseSaturation),
      aluminumSaturation:
        parseOptionalNumber(formData.aluminumSaturation),
      notes:
        formData.notes.trim() ||
        undefined,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="soil-land-area"
                className="block text-sm font-medium"
              >
                Talhão *
              </label>

              <HelpTip
                title="O que é um talhão?"
                description="É uma divisão da propriedade usada para organizar uma área de produção. Um talhão pode reunir cultivo, análises de solo, manejos, colheitas e operações realizadas naquela área."
              />
            </div>

            {talhoes.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Nenhum talhão cadastrado. Cadastre primeiro uma área do tipo Talhão.
              </p>
            ) : (
              <select
                id="soil-land-area"
                name="landAreaId"
                value={formData.landAreaId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">
                  Selecione um talhão
                </option>

                {talhoes.map(area => (
                  <option
                    key={area.id}
                    value={area.id}
                  >
                    {area.code} — {area.name}
                  </option>
                ))}
              </select>
            )}

            {errors.landAreaId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.landAreaId}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Data da análise *"
              name="sampleDate"
              type="date"
              value={formData.sampleDate}
              onChange={handleChange}
              required
            />

            {errors.sampleDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.sampleDate}
              </p>
            )}
          </div>

          <div>
            <Input
              label="Laboratório"
              name="laboratory"
              value={formData.laboratory}
              onChange={handleChange}
              placeholder="Ex: Laboratório Agro"
            />
          </div>

          <div>
            <Input
              label="Código da amostra"
              name="sampleCode"
              value={formData.sampleCode}
              onChange={handleChange}
              placeholder="Ex: AM-001"
            />
          </div>

          <div>
            <Input
              label="Profundidade da amostra"
              name="sampleDepth"
              value={formData.sampleDepth}
              onChange={handleChange}
              placeholder="Ex: 0-20 cm"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="soil-ph"
                className="block text-sm font-medium"
              >
                pH
              </label>

              <HelpTip
                title="O que é pH do solo?"
                description="O pH indica se o solo está mais ácido ou mais alcalino. Esse valor influencia a disponibilidade de nutrientes para as plantas."
              />
            </div>

            <Input
              id="soil-ph"
              label=""
              name="ph"
              type="number"
              step="any"
              value={formData.ph}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="soil-organic-matter"
                className="block text-sm font-medium"
              >
                Matéria orgânica (%)
              </label>

              <HelpTip
                title="O que é matéria orgânica?"
                description="É a parte do solo formada por restos vegetais e outros materiais orgânicos. Ela contribui para a fertilidade e a qualidade do solo."
              />
            </div>

            <Input
              id="soil-organic-matter"
              label=""
              name="organicMatter"
              type="number"
              step="any"
              value={formData.organicMatter}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <Input
              label="Fósforo (mg/dm³)"
              name="phosphorus"
              type="number"
              step="any"
              value={formData.phosphorus}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <Input
              label="Potássio (mg/dm³)"
              name="potassium"
              type="number"
              step="any"
              value={formData.potassium}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <Input
              label="Cálcio (cmolc/dm³)"
              name="calcium"
              type="number"
              step="any"
              value={formData.calcium}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <Input
              label="Magnésio (cmolc/dm³)"
              name="magnesium"
              type="number"
              step="any"
              value={formData.magnesium}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <Input
              label="Alumínio (cmolc/dm³)"
              name="aluminum"
              type="number"
              step="any"
              value={formData.aluminum}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="soil-cec"
                className="block text-sm font-medium"
              >
                CTC (cmolc/dm³)
              </label>

              <HelpTip
                title="O que é CTC?"
                description="A CTC, ou capacidade de troca de cátions, indica a capacidade do solo de reter nutrientes importantes para as plantas. Em geral, valores maiores indicam maior capacidade de armazenar esses nutrientes."
              />
            </div>

            <Input
              id="soil-cec"
              label=""
              name="cec"
              type="number"
              step="any"
              value={formData.cec}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <label
                htmlFor="soil-base-saturation"
                className="block text-sm font-medium"
              >
                Saturação por bases (%)
              </label>

              <HelpTip
                title="O que é saturação por bases?"
                description="É uma medida usada para avaliar quanto da capacidade do solo está ocupada por nutrientes como cálcio, magnésio e potássio."
              />
            </div>

            <Input
              id="soil-base-saturation"
              label=""
              name="baseSaturation"
              type="number"
              step="any"
              value={formData.baseSaturation}
              onChange={handleChange}
              placeholder="0.0"
            />
          </div>

          <div>
            <Input
              label="Saturação por alumínio (%)"
              name="aluminumSaturation"
              type="number"
              step="any"
              value={formData.aluminumSaturation}
              onChange={handleChange}
              placeholder="0.0"
            />
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
            placeholder="Observações adicionais (opcional)"
          />
        </div>

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {submitError}
          </div>
        )}
      </Card>

      <div className="mt-6 flex gap-3">
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