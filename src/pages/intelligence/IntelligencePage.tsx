import {
  useCallback,
  useMemo,
  useState,
} from 'react'
import HelpTip from '../../components/ui/HelpTip'
import Card from '../../components/ui/Card'
import IntelligenceMetricCard from '../../components/intelligence/IntelligenceMetricCard'
import IntelligenceInsightCard from '../../components/intelligence/IntelligenceInsightCard'
import IntelligenceFilters, {
  defaultIntelligenceFilters,
  type IntelligenceFiltersValue,
} from '../../components/intelligence/IntelligenceFilters'
import IntelligenceAssistant from '../../components/intelligence/IntelligenceAssistant'
import DataQualityCard from '../../components/intelligence/DataQualityCard'
import {
  useAuth,
} from '../../hooks/useAuth'
import {
  getIntelligenceDataQualityIssues,
  getIntelligenceInsights,
  getIntelligenceMetricSummary,
} from '../../services/intelligenceService'
import {
  IntelligenceInsight,
  IntelligenceSeverity,
} from '../../types'

function normalize(
  value: string,
): string {
  return value
    .toLowerCase()
    .trim()
}

function matchesSearch(
  insight: IntelligenceInsight,
  search: string,
): boolean {
  if (!search) return true

  const term =
    normalize(search)

  return (
    normalize(
      insight.title,
    ).includes(term) ||
    normalize(
      insight.description,
    ).includes(term) ||
    normalize(
      insight.moduleLabel,
    ).includes(term)
  )
}

function matchesSeverity(
  insight: IntelligenceInsight,
  severity:
    IntelligenceFiltersValue[
      'severity'
    ],
): boolean {
  if (
    severity === 'all'
  ) {
    return true
  }

  return (
    insight.severity ===
    severity
  )
}

function matchesModule(
  insight: IntelligenceInsight,
  moduleKey:
    IntelligenceFiltersValue[
      'module'
    ],
): boolean {
  if (
    moduleKey === 'all'
  ) {
    return true
  }

  return (
    insight.module ===
    moduleKey
  )
}

export default function IntelligencePage() {
  const { user } =
    useAuth()

  const [
    filters,
    setFilters,
  ] =
    useState<IntelligenceFiltersValue>(
      defaultIntelligenceFilters,
    )

  const [
    revision,
    setRevision,
  ] =
    useState(0)

  const intelligenceData =
    useMemo(() => {
      // A revisão força uma nova leitura dos dados depois
      // que uma ação assistida altera algum módulo.
      void revision

      return {
        insights:
          getIntelligenceInsights(
            user,
          ),
        summary:
          getIntelligenceMetricSummary(
            user,
          ),
        dataQualityIssues:
          getIntelligenceDataQualityIssues(
            user,
          ),
      }
    }, [user, revision])

  const {
    insights,
    summary,
    dataQualityIssues,
  } = intelligenceData

  const filteredInsights =
    useMemo(
      () =>
        insights.filter(
          insight =>
            matchesSeverity(
              insight,
              filters.severity,
            ) &&
            matchesModule(
              insight,
              filters.module,
            ) &&
            matchesSearch(
              insight,
              filters.search,
            ),
        ),
      [
        insights,
        filters,
      ],
    )

  const hasCriticalOrWarning =
    useMemo(
      () =>
        insights.some(
          (
            insight:
              IntelligenceInsight,
          ) =>
            insight.severity ===
              'critical' ||
            insight.severity ===
              'warning',
        ),
      [insights],
    )

  const severityForTone = (
    severity:
      IntelligenceSeverity,
  ):
    | 'attention'
    | 'opportunity'
    | 'information'
    | 'neutral' => {
    if (
      severity ===
        'critical' ||
      severity ===
        'warning'
    ) {
      return 'attention'
    }

    if (
      severity ===
      'opportunity'
    ) {
      return 'opportunity'
    }

    if (
      severity ===
      'information'
    ) {
      return 'information'
    }

    return 'neutral'
  }

  const handleActionExecuted =
    useCallback(() => {
      setRevision(
        previous =>
          previous + 1,
      )
    }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">
          Agro360 Intelligence
        </h1>

        <HelpTip
          title="Para que serve o Agro360 Intelligence?"
          description="O Agro360 Intelligence analisa os dados cadastrados nos diferentes módulos da propriedade para identificar situações que merecem atenção, oportunidades e informações úteis para a gestão rural."
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Central de análise dos dados cadastrados. As informações são
        geradas a partir dos registros da propriedade, sem previsões
        externas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <IntelligenceMetricCard
          label="Precisa de atenção"
          value={
            summary.needsAttention
          }
          helper="Críticos e alertas"
          tone={
            summary.needsAttention >
            0
              ? severityForTone(
                  'critical',
                )
              : 'neutral'
          }
        />

        <IntelligenceMetricCard
          label="Oportunidades"
          value={
            summary.opportunities
          }
          tone="opportunity"
        />

        <IntelligenceMetricCard
          label="Informações"
          value={
            summary.informations
          }
          tone="information"
        />

        <IntelligenceMetricCard
          label="Módulos analisados"
          value={
            summary.modulesAnalyzed
          }
          helper="Módulos autorizados para o seu perfil"
        />
      </div>

      <IntelligenceAssistant
        onActionExecuted={
          handleActionExecuted
        }
      />

      <IntelligenceFilters
        value={filters}
        onChange={
          setFilters
        }
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Insights identificados
        </h2>

        {
          insights.length ===
          0 ? (
            <Card className="p-4 text-sm text-gray-600 dark:text-gray-400">
              Nenhuma situação relevante foi identificada nos dados
              disponíveis.
            </Card>
          ) : filteredInsights.length ===
            0 ? (
            <Card className="p-4 text-sm text-gray-600 dark:text-gray-400">
              Nenhum insight corresponde aos filtros selecionados.
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {
                filteredInsights.map(
                  insight => (
                    <IntelligenceInsightCard
                      key={
                        insight.id
                      }
                      insight={
                        insight
                      }
                    />
                  ),
                )
              }
            </div>
          )
        }

        {
          insights.length >
            0 &&
          !hasCriticalOrWarning && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma situação crítica ou de atenção foi identificada
              nos dados disponíveis.
            </p>
          )
        }
      </section>

      {
        dataQualityIssues.length >
          0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Qualidade das informações
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pontos que podem limitar a profundidade das análises.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {
                dataQualityIssues.map(
                  issue => (
                    <DataQualityCard
                      key={
                        issue.id
                      }
                      issue={
                        issue
                      }
                    />
                  ),
                )
              }
            </div>
          </section>
        )
      }
    </div>
  )
}