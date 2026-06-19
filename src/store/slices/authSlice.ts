import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { rpcCall } from "../../utils/rpcCall"
import type { User, Role } from "../../types"
import type { RolePermissions } from "../../modules/roles/types"
import { normalizePermissions } from "../../modules/roles/utils/role-normalizer"

interface AuthState {
  user: User | null
  role: Role | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

// Safely get data from localStorage
const getStoredUser = () => {
  try {
    const user = localStorage.getItem("auth_user")
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

function safeParsePermissions(
  permissions: unknown,
): Partial<RolePermissions> | null {
  if (typeof permissions === "string") {
    try {
      return JSON.parse(permissions) as Partial<RolePermissions>
    } catch {
      return null
    }
  }

  return permissions as Partial<RolePermissions> | null
}

const getStoredRole = () => {
  try {
    const role = localStorage.getItem("auth_role")
    return role ? JSON.parse(role): null
  } catch {
    return null
  }
}

const initialState: AuthState = {
  user: getStoredUser(),
  role: getStoredRole(),
  isAuthenticated: !!getStoredUser(),
  loading: false,
  error: null,
}

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ username, password }: any, { rejectWithValue }) => {
    try {
      const data = await rpcCall<any>("login_user", {
        p_user_name: username,
        p_password: password,
      })

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error("Invalid username or password")
      }

      return data
    } catch (err: any) {
      return rejectWithValue(err.message || "Login failed")
    }
  },
)

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.role = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem("auth_user")
      localStorage.removeItem("auth_role")
    },
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem("auth_user", JSON.stringify(state.user))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false

        let payload = action.payload


        // If the RPC returns an array, take the first element
        if (Array.isArray(payload)) {
          payload = payload[0]
        }

        if (!payload) {
          state.error = "No user data received"
          state.isAuthenticated = false
          return
        }

        // Handle both { user, role } and direct user object structures
        const user = payload.user || payload
        const rawRole = payload.user.permissions

        if (user && (user.id || user.user_id)) {
          state.user = user
          state.role = rawRole
          state.isAuthenticated = true
          state.error = null

          // Persist to localStorage
          localStorage.setItem("auth_user", JSON.stringify(user))
          if (rawRole) {
            localStorage.setItem("auth_role", JSON.stringify(rawRole))
          }
        } else {
          state.error = "Invalid user data received"
          state.isAuthenticated = false
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || "Login failed"
        state.isAuthenticated = false
        localStorage.removeItem("auth_user")
        localStorage.removeItem("auth_role")
      })
  },
})

export const { logout, updateUser } = authSlice.actions
export default authSlice.reducer

export const selectPermissions = (state: { auth: AuthState }) => {
  const role = state.auth.role;
  if (!role) return undefined;
  if (role.permissions && typeof role.permissions === 'object') {
    return role.permissions;
  }
  return role;
};
