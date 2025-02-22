declare module "@/lib/hooks/useAuth" {
  import { User } from "firebase/auth";

  type UserRole = "client" | "engineer" | "admin";

  interface AuthUser extends User {
    role?: UserRole;
  }

  interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signUp: (email: string, password: string, role: UserRole) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  }

  export function useAuth(): AuthContextType;
}

declare module "@/components/auth/ProtectedRoute" {
  import { ReactNode } from "react";
  
  type UserRole = "client" | "engineer" | "admin";

  interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
  }

  export default function ProtectedRoute(props: ProtectedRouteProps): JSX.Element;
} 