// src/App.tsx
import { Router as WouterRouter, Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import Home from "@/pages/Home";
import Team from "@/pages/Team";
import OrgChart from "@/pages/OrgChart";
import { SmartAvatar } from "@/components/SmartAvatar";
import Holidays from "@/pages/Holidays";
import Employment from "@/pages/Employment";
import Documents from "@/pages/Documents";
import Analytics from "@/pages/Analytics";
import ManagerTeamCalendar from "@/pages/TeamCalander";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import DevTools from "@/pages/DevTools";
import Manager from "@/pages/Manager";
import Assets from "@/pages/Assets";
import AssetDetails from "@/pages/AssetDetails";
import LicenseDetails from "@/pages/LicenseDetails";
import Inventory from "@/pages/Inventory";
import { useEmployee } from "@/context/EmployeeProvider";
import { EmployeeProvider } from "@/context/EmployeeProvider";
import { selectUser } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import { EMPLOYEE_BASE_PATH, ADMIN_BASE_PATH } from "@/lib/paths";
import { AdminAuthProvider } from "@/admin/context/AdminAuthContext";
import { AdminLoginPage } from "@/admin/pages/AdminLogin";
import { AdminDashboardPage } from "@/admin/pages/AdminDashboard";

function ProtectedRoute({ component: Component }: any) {
  const [, setLocation] = useLocation();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  if (!user) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/team" component={() => <ProtectedRoute component={Team} />} />
      <Route path="/org-chart" component={() => <ProtectedRoute component={OrgChart} />} />
      <Route path="/holidays" component={() => <ProtectedRoute component={Holidays} />} />
      <Route path="/employment" component={() => <ProtectedRoute component={Employment} />} />
      <Route path="/documents" component={() => <ProtectedRoute component={Documents} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/manager/calendar" component={() => <ProtectedRoute component={ManagerTeamCalendar} />} />
      <Route path="/manager" component={() => <ProtectedRoute component={Manager} />} />
      <Route path="/dev" component={() => <ProtectedRoute component={DevTools} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
      <Route path="/assets" component={() => <ProtectedRoute component={Assets} />} />
      <Route path="/assets/:id" component={() => <ProtectedRoute component={AssetDetails} />} />
      <Route path="/licenses/:id" component={() => <ProtectedRoute component={LicenseDetails} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <>
      <WouterRouter base={ADMIN_BASE_PATH}>
        <AdminAuthProvider>
          <Switch>
            <Route path="/login" component={AdminLoginPage} />
            <Route path="/dashboard" component={AdminDashboardPage} />
          </Switch>
        </AdminAuthProvider>
      </WouterRouter>

      <WouterRouter base={EMPLOYEE_BASE_PATH}>
        <EmployeeProvider>
          <Router />
        </EmployeeProvider>
      </WouterRouter>
    </>
  );
}