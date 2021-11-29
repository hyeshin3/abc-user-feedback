import client from './apiClient'

/**
 * Admin
 */
export const getRoles = () => {
  return client.get(`/admin/roles`).then((res) => res.data)
}

export const getRoleByName = (roleName: string) => {
  return client.get(`/admin/roles/${roleName}`).then((res) => res.data)
}

export const createRole = (payload) => {
  return client.post(`/admin/roles`, payload).then((res) => res.data)
}

export const rolePermissionBinding = (payload) => {
  return client
    .post(`/admin/roles/binding/permission`, payload)
    .then((res) => res.data)
}

export const rolePermissionUnbinding = (payload) => {
  return client
    .delete(`/admin/roles/binding/permission`, {
      data: payload
    })
    .then((res) => res.data)
}

export const getRolePermissions = (roleName: string) => {
  return client
    .get(`/admin/roles/binding/permission?roleName=${roleName}`)
    .then((res) => res.data)
}

export const roleBindingPermission = () => {}