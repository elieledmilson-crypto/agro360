import { User } from '../types'
import {
  getAccessAccountByEmail,
  normalizeAccessEmail,
  resolveSessionCandidate,
} from './employeeService'

export interface LoginResponse {
  token: string
  user: User
}

export async function login(
  email: string,
  _password: string,
): Promise<LoginResponse> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const normalizedEmail = normalizeAccessEmail(email)

  const account = getAccessAccountByEmail(normalizedEmail)

  if (!account) {
    throw new Error('Conta de acesso não encontrada.')
  }

  if (account.status !== 'Ativo') {
    throw new Error('Esta conta de acesso está inativa.')
  }

  // resolveSessionCandidate já valida funcionário + status
  const session = resolveSessionCandidate({
    id: account.id,
    employeeId: account.employeeId,
    email: account.email,
  })

  if (!session) {
    throw new Error('Esta conta de acesso está inativa.')
  }

  return {
    token: 'mock-token-' + Date.now(),
    user: session.user,
  }
}

export function restoreSessionUser(candidate: unknown): User | null {
  const session = resolveSessionCandidate(candidate)

  if (!session) return null

  return session.user
}