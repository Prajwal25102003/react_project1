import { AuthProvider } from "./controllers/authContext.jsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
} from "./views/components/ProtectedRoute.jsx";
import { HR_ADMIN_ROLES, ROLES } from "./models/authModel.js";
import AppShell from "./views/layout/AppShell.jsx";
import DashboardPage from "./views/dashboard/DashboardPage.jsx";
import EmployeesPage from "./views/pages/EmployeesPage.jsx";
import EmployeeFormPage from "./views/pages/EmployeeFormPage.jsx";
import DepartmentsPage from "./views/pages/DepartmentsPage.jsx";
import DepartmentFormPage from "./views/pages/DepartmentFormPage.jsx";
import AttendancePage from "./views/pages/AttendancePage.jsx";
import AttendanceFormPage from "./views/pages/AttendanceFormPage.jsx";
import LeaveRequestsPage from "./views/pages/LeaveRequestsPage.jsx";
import LeaveFormPage from "./views/pages/LeaveFormPage.jsx";
import ProfilePage from "./views/pages/ProfilePage.jsx";
import NotFoundPage from "./views/pages/NotFoundPage.jsx";
import SignInPage from "./views/pages/SignInPage.jsx";

function AppRoutes() {
  return (
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
          </Route>

          <Route element={<RoleRoute roles={[ROLES.EMPLOYEE]} />}>
            <Route path="leave-requests/new" element={<LeaveFormPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
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
