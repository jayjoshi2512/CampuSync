// frontend/src/store/authStore.ts
import { create } from 'zustand';

interface Organization {
  id: number;
  name: string;
  slug?: string;
  plan?: string;
  brand_color?: string;
  brand_color_rgb?: string;
  logo_url?: string;
  selected_card_template?: string;
  card_back_image_url?: string;
}

interface Actor {
  id: number;
  email: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'user';
  org_role?: 'owner' | 'co_admin';
  organization?: Organization;
  // User-specific fields
  roll_number?: string;
  branch?: string;
  batch_year?: number;
  avatar_url?: string;
  bio?: string;
}

interface AuthState {
  token: string | null;
  actor: Actor | null;
  isAuthenticated: boolean;
  role: string | null;
  orgId: number | null;
  setAuth: (token: string, actor: Actor) => void;
  clearAuth: () => void;
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Restore from localStorage
function getInitialState() {
  const token = localStorage.getItem('phygital_token');
  const actorStr = localStorage.getItem('phygital_actor');
  if (token && actorStr) {
    try {
      const actor = JSON.parse(actorStr);
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        return {
          token,
          actor,
          isAuthenticated: true,
          role: actor.role,
          orgId: actor.organization?.id || decoded.org || null,
        };
      }
    } catch {
      // Invalid stored data
    }
  }
  return { token: null, actor: null, isAuthenticated: false, role: null, orgId: null };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  setAuth: (token: string, actor: Actor) => {
    localStorage.setItem('phygital_token', token);
    localStorage.setItem('phygital_actor', JSON.stringify(actor));
    const decoded = parseJwt(token);
    set({
      token,
      actor,
      isAuthenticated: true,
      role: actor.role,
      orgId: actor.organization?.id || decoded?.org || null,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('phygital_token');
    localStorage.removeItem('phygital_actor');
    set({
      token: null,
      actor: null,
      isAuthenticated: false,
      role: null,
      orgId: null,
    });
  },
}));
