const VALID_ROLES = ['tenant', 'owner', 'admin']

export function normalizeRequestedRole(role) {
  if (role === undefined || role === null || role === '') return null

  const normalized = String(role).trim().toLowerCase()
  return VALID_ROLES.includes(normalized) ? normalized : null
}

export function validateRequestedRole(requestedRole, userRole) {
  const normalizedRequestedRole = normalizeRequestedRole(requestedRole)
  const normalizedUserRole = normalizeRequestedRole(userRole)

  if (!normalizedRequestedRole) return
  if (!normalizedUserRole) return

  if (normalizedRequestedRole !== normalizedUserRole) {
    throw new Error(
      `This account is not registered as a ${normalizedRequestedRole}. Please use the correct ${normalizedUserRole} sign-in flow.`,
    )
  }
}
