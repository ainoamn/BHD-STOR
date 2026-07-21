import type { AuthResponse, LoginData, RegisterData, User } from "@/types";
import { DEMO_ACCESS_TOKEN, DEMO_REFRESH_TOKEN } from "@/lib/demo-token";

const DEMO_TOKEN = DEMO_ACCESS_TOKEN;
const DEMO_REFRESH = DEMO_REFRESH_TOKEN;
const DEMO_USER_KEY = "bhd_demo_user";

const ADMIN_EMAILS = ["admin@bhd.om", "admin@bhdoman.com"];

function createDemoUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: User["role"];
  id?: string;
}): User {
  const now = new Date().toISOString();
  return {
    id: data.id || "demo-user-1",
    email: data.email,
    phone: data.phone,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    role: data.role || "customer",
    status: "active",
    isEmailVerified: true,
    isPhoneVerified: false,
    addresses: [],
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
}

function storeDemoUser(user: User): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
}

function getStoredDemoUser(): User | null {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(DEMO_USER_KEY);
      if (raw) return JSON.parse(raw) as User;
    }
  } catch {
    // ignore
  }
  return null;
}

function clearDemoUser(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DEMO_USER_KEY);
    }
  } catch {
    // ignore
  }
}

function resolveRole(email: string): User["role"] {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return "admin";
  }
  return "customer";
}

export function demoLogin(data: LoginData): AuthResponse {
  if (!data.email || data.password.length < 6) {
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  const email = data.email.toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email);
  const namePart = data.email.split("@")[0] || "مستخدم";

  const user = createDemoUser({
    id: isAdmin ? "demo-admin-1" : "demo-user-1",
    email: data.email,
    firstName: isAdmin ? "مدير" : namePart,
    lastName: isAdmin ? "النظام" : "تجريبي",
    role: resolveRole(email),
  });

  storeDemoUser(user);

  return {
    user,
    accessToken: DEMO_TOKEN,
    refreshToken: DEMO_REFRESH,
    expiresIn: 3600,
  };
}

export function demoRegister(data: RegisterData): AuthResponse {
  const user = createDemoUser({
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    role: data.role || "customer",
  });

  storeDemoUser(user);

  return {
    user,
    accessToken: DEMO_TOKEN,
    refreshToken: DEMO_REFRESH,
    expiresIn: 3600,
  };
}

export function demoGetMe(): User {
  const stored = getStoredDemoUser();
  if (stored) return stored;

  return createDemoUser({
    email: "demo@bhd.om",
    firstName: "مستخدم",
    lastName: "تجريبي",
  });
}

export function demoLogout(): void {
  clearDemoUser();
}

export { isDemoToken } from "@/lib/demo-token";
