import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './views/layout/AppShell.jsx'
import DashboardPage from './views/dashboard/DashboardPage.jsx'
import CalendarPage from './views/pages/CalendarPage.jsx'
import LineChartPage from './views/pages/LineChartPage.jsx'
import BarChartPage from './views/pages/BarChartPage.jsx'
import AlertsPage from './views/pages/AlertsPage.jsx'
import AvatarsPage from './views/pages/AvatarsPage.jsx'
import BadgePage from './views/pages/BadgePage.jsx'
import ButtonsPage from './views/pages/ButtonsPage.jsx'
import ImagesPage from './views/pages/ImagesPage.jsx'
import VideosPage from './views/pages/VideosPage.jsx'
import BasicTablesPage from './views/pages/BasicTablesPage.jsx'
import FormElementsPage from './views/pages/FormElementsPage.jsx'
import ProfilePage from './views/pages/ProfilePage.jsx'
import BlankPage from './views/pages/BlankPage.jsx'
import NotFoundPage from './views/pages/NotFoundPage.jsx'
import SignInPage from './views/pages/SignInPage.jsx'
import SignUpPage from './views/pages/SignUpPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/404" element={<NotFoundPage />} />

      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="form-elements" element={<FormElementsPage />} />
        <Route path="basic-tables" element={<BasicTablesPage />} />
        <Route path="blank" element={<BlankPage />} />
        <Route path="line-chart" element={<LineChartPage />} />
        <Route path="bar-chart" element={<BarChartPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="avatars" element={<AvatarsPage />} />
        <Route path="badge" element={<BadgePage />} />
        <Route path="buttons" element={<ButtonsPage />} />
        <Route path="images" element={<ImagesPage />} />
        <Route path="videos" element={<VideosPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
