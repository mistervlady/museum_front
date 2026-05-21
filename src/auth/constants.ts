/**
 * Staff role types for the authorization system
 */
export const STAFF_ROLES = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const

export type StaffRole = (typeof STAFF_ROLES)[keyof typeof STAFF_ROLES]

/**
 * Role display names in Russian
 */
export const ROLE_DISPLAY_NAMES: Record<StaffRole, string> = {
  superadmin: 'Суперадминистратор',
  owner: 'Владелец',
  editor: 'Редактор',
  viewer: 'Наблюдатель',
}

/**
 * Valid staff roles that have access to admin features (deprecated, kept for compatibility)
 */
export const VALID_STAFF_ROLES = ['superadmin', 'owner', 'editor', 'viewer'] as const

/**
 * Type for valid staff roles (deprecated, kept for compatibility)
 */
export type ValidStaffRole = (typeof VALID_STAFF_ROLES)[number]
