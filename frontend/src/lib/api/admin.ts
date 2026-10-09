import { apiClient } from "./client";
import type {
  AdminPasswordResetRequest,
  AdminUserCreate,
  AdminUserCreateResponse,
  AdminUserListResponse,
  Role,
  User,
} from "./types";

export interface ListUsersParams {
  page: number;
  page_size: number;
  role?: Role;
  is_active?: boolean;
  /** Matches the first name, last name, both together in either order, or the ID number. Case-insensitive. */
  search?: string;
}

/** GET /api/admin/users - real page/page_size/role/is_active/search query params */
export async function listUsers(params: ListUsersParams): Promise<AdminUserListResponse> {
  const res = await apiClient.get<AdminUserListResponse>("/api/admin/users", { params });
  return res.data;
}

const createEndpoint: Record<Role, string> = {
  learner: "/api/admin/learners",
  facilitator: "/api/admin/facilitators",
  admin: "/api/admin/admins",
};

/** POST /api/admin/{learners,facilitators,admins} - same body shape for all three roles */
export async function createUser(role: Role, data: AdminUserCreate): Promise<AdminUserCreateResponse> {
  const res = await apiClient.post<AdminUserCreateResponse>(createEndpoint[role], data);
  return res.data;
}

/** PATCH /api/admin/users/{id}/deactivate */
export async function deactivateUser(userId: number): Promise<User> {
  const res = await apiClient.patch<User>(`/api/admin/users/${userId}/deactivate`);
  return res.data;
}

/** PATCH /api/admin/users/{id}/activate */
export async function activateUser(userId: number): Promise<User> {
  const res = await apiClient.patch<User>(`/api/admin/users/${userId}/activate`);
  return res.data;
}

/** PATCH /api/admin/users/{id}/password - admin-set, just {password}, no current password. Admin targets only. */
export async function resetPassword(userId: number, data: AdminPasswordResetRequest): Promise<User> {
  const res = await apiClient.patch<User>(`/api/admin/users/${userId}/password`, data);
  return res.data;
}

/**
 * PATCH /api/admin/users/{id}/password with NO body - learner/facilitator targets.
 * The backend sets the fixed default password and flags must_change_password; it
 * rejects (400 PASSWORD_NOT_ALLOWED) any request that carries a password, so
 * nothing is passed as data here, not even an empty object.
 */
export async function resetPasswordToDefault(userId: number): Promise<User> {
  const res = await apiClient.patch<User>(`/api/admin/users/${userId}/password`);
  return res.data;
}
