import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
  const { loading } = useAuth();
  if (loading) return null;
  // Authentication disabled: always allow access
  return <Outlet />;
}
