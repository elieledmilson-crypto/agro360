import { LandAreaType } from '../../types'

export interface MapTypeStyle {
  rectClass: string
  swatchClass: string
  textClass: string
}

export const MAP_TYPE_STYLES: Record<LandAreaType, MapTypeStyle> = {
  'Piquete': {
    rectClass:
      'fill-emerald-100 stroke-emerald-600 dark:fill-emerald-900 dark:stroke-emerald-400',
    swatchClass:
      'bg-emerald-200 border-emerald-600 dark:bg-emerald-900 dark:border-emerald-400',
    textClass: 'fill-emerald-900 dark:fill-emerald-100',
  },
  'Talhão': {
    rectClass:
      'fill-amber-100 stroke-amber-600 dark:fill-amber-900 dark:stroke-amber-400',
    swatchClass:
      'bg-amber-200 border-amber-600 dark:bg-amber-900 dark:border-amber-400',
    textClass: 'fill-amber-900 dark:fill-amber-100',
  },
  'Pastagem': {
    rectClass:
      'fill-green-100 stroke-green-600 dark:fill-green-900 dark:stroke-green-400',
    swatchClass:
      'bg-green-200 border-green-600 dark:bg-green-900 dark:border-green-400',
    textClass: 'fill-green-900 dark:fill-green-100',
  },
  'Reserva/APP': {
    rectClass:
      'fill-teal-100 stroke-teal-600 dark:fill-teal-900 dark:stroke-teal-400',
    swatchClass:
      'bg-teal-200 border-teal-600 dark:bg-teal-900 dark:border-teal-400',
    textClass: 'fill-teal-900 dark:fill-teal-100',
  },
  'Infraestrutura': {
    rectClass:
      'fill-blue-100 stroke-blue-600 dark:fill-blue-900 dark:stroke-blue-400',
    swatchClass:
      'bg-blue-200 border-blue-600 dark:bg-blue-900 dark:border-blue-400',
    textClass: 'fill-blue-900 dark:fill-blue-100',
  },
  'Área ociosa': {
    rectClass:
      'fill-gray-100 stroke-gray-500 dark:fill-gray-800 dark:stroke-gray-400',
    swatchClass:
      'bg-gray-200 border-gray-500 dark:bg-gray-800 dark:border-gray-400',
    textClass: 'fill-gray-800 dark:fill-gray-200',
  },
  'Outro': {
    rectClass:
      'fill-purple-100 stroke-purple-600 dark:fill-purple-900 dark:stroke-purple-400',
    swatchClass:
      'bg-purple-200 border-purple-600 dark:bg-purple-900 dark:border-purple-400',
    textClass: 'fill-purple-900 dark:fill-purple-100',
  },
}

export const MAP_TYPE_ORDER: LandAreaType[] = [
  'Piquete',
  'Talhão',
  'Pastagem',
  'Reserva/APP',
  'Infraestrutura',
  'Área ociosa',
  'Outro',
]

export function getMapTypeStyle(type: LandAreaType): MapTypeStyle {
  return MAP_TYPE_STYLES[type] ?? MAP_TYPE_STYLES['Outro']
}