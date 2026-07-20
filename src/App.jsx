import { lazy, Suspense } from "react";
import { AuthProvider } from "./controllers/authContext.jsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
} from "./views/components/ProtectedRoute.jsx";
import { HR_ADMIN_ROLES, ROLES } from "./models/authModel.js";
import AppShell from "./views/layout/AppShell.jsx";

const DashboardPage = lazy(() => import("./views/dashboard/DashboardPage.jsx"));
const EmployeesPage = lazy(() => import("./views/pages/EmployeesPage.jsx"));
const EmployeeFormPage = lazy(
  () => import("./views/pages/EmployeeFormPage.jsx"),
);
const DepartmentsPage = lazy(() => import("./views/pages/DepartmentsPage.jsx"));
const DepartmentFormPage = lazy(
  () => import("./views/pages/DepartmentFormPage.jsx"),
);
const AttendancePage = lazy(() => import("./views/pages/AttendancePage.jsx"));
const AttendanceFormPage = lazy(
  () => import("./views/pages/AttendanceFormPage.jsx"),
);
const LeaveRequestsPage = lazy(
  () => import("./views/pages/LeaveRequestsPage.jsx"),
);
const LeaveApprovalsPage = lazy(
  () => import("./views/pages/LeaveApprovalsPage.jsx"),
);
const LeaveFormPage = lazy(() => import("./views/pages/LeaveFormPage.jsx"));
const HolidaysPage = lazy(() => import("./views/pages/HolidaysPage.jsx"));
const ProfilePage = lazy(() => import("./views/pages/ProfilePage.jsx"));
const NotFoundPage = lazy(() => import("./views/pages/NotFoundPage.jsx"));
const SignInPage = lazy(() => import("./views/pages/SignInPage.jsx"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <p className="text-theme-sm text-gray-500">Loading…</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="/signin" element={<SignInPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />

            <Route element={<RoleRoute roles={HR_ADMIN_ROLES} />}>
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/new" element={<EmployeeFormPage />} />
              <Route path="employees/:id/edit" element={<EmployeeFormPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="departments/new" element={<DepartmentFormPage />} />
              <Route
                path="departments/:id/edit"
                element={<DepartmentFormPage />}
              />
              <Route path="attendance/new" element={<AttendanceFormPage />} />
              <Route
                path="attendance/:id/edit"
                element={<AttendanceFormPage />}
              />
            </Route>

            <Route
              element={
                <RoleRoute roles={[ROLES.HR, ROLES.ADMIN, ROLES.EMPLOYEE]} />
              }
            >
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leave-requests" element={<LeaveRequestsPage />} />
              <Route path="leave-approvals" element={<LeaveApprovalsPage />} />
              <Route path="leave-requests/new" element={<LeaveFormPage />} />
              <Route path="holidays" element={<HolidaysPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
