/**
 * Valid staff roles that have access to admin features
 */
export const VALID_STAFF_ROLES = ['admin', 'editor', 'viewer'] as const

/**
 * Type for valid staff roles
 */
export type ValidStaffRole = (typeof VALID_STAFF_ROLES)[number]
