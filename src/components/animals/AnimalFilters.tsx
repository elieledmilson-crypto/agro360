import {
  AnimalCategory,
  AnimalSex,
  AnimalSpecies,
  AnimalStatus,
  Lot,
} from '../../types'

export interface AnimalFiltersState {
  search: string
  species: AnimalSpecies | ''
  sex: AnimalSex | ''
  category: AnimalCategory | ''
  status: AnimalStatus | ''
  lotId: string
}

interface Props {
  filters: AnimalFiltersState
  onChange: (filters: AnimalFiltersState) => void
  onClear: () => void
  lots: Lot[]
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

export default function AnimalFilters({
  filters,
  onChange,
  onClear,
  lots,
}: Props) {
  const update = (
    key: keyof AnimalFiltersState,
    value: string,
  ) => {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Pesquisar por identificação, nome ou raça..."
            value={filters.search}
            onChange={event =>
              update('search', event.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <select
          value={filters.species}
          onChange={event =>
            update('species', event.target.value)
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Filtrar por espécie"
        >
          <option value="">Espécie: todas</option>

          {speciesOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filters.sex}
          onChange={event =>
            update('sex', event.target.value)
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Filtrar por sexo"
        >
          <option value="">Sexo: todos</option>

          {sexOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={event =>
            update('category', event.target.value)
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Filtrar por categoria"
        >
          <option value="">Categoria: todas</option>

          {categoryOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={event =>
            update('status', event.target.value)
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Filtrar por situação"
        >
          <option value="">Situação: todas</option>

          {statusOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filters.lotId}
          onChange={event =>
            update('lotId', event.target.value)
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Filtrar por lote"
        >
          <option value="">Lote: todos</option>

          {lots.map(lot => (
            <option key={lot.id} value={lot.id}>
              {lot.name}
            </option>
          ))}
        </select>

        <div className="lg:col-span-6 flex justify-end">
          <button
            onClick={onClear}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    </div>
  )
}