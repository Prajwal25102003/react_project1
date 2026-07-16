import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../controllers/authContext.jsx";
import { roleAllows } from "../../models/authModel.js";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <p className="p-6 text-theme-sm text-gray-500">Checking session…</p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <p className="p-6 text-theme-sm text-gray-500">Checking session…</p>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ roles }) {
  const { user } = useAuth();

  if (!roleAllows(user?.role, roles)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-medium text-gray-800">Access denied</h2>
        <p className="mt-1 text-sm text-gray-500">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
