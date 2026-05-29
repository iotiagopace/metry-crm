import { createBrowserRouter, Navigate } from "react-router";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { OrgList } from "./pages/organizations/OrgList";
import { OrgDetail } from "./pages/organizations/OrgDetail";
import { PipelineBoard } from "./pages/pipeline/PipelineBoard";
import { TaskList } from "./pages/tasks/TaskList";
import { SettingsStages } from "./pages/settings/Stages";
import { Reports } from "./pages/reports/Reports";

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>{children}</ProtectedRoute>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <AuthProvider>
        <Login />
      </AuthProvider>
    ),
  },
  {
    element: (
      <Wrap>
        <Layout />
      </Wrap>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",         element: <Dashboard /> },
      { path: "organizations",     element: <OrgList /> },
      { path: "organizations/:id", element: <OrgDetail /> },
      { path: "pipeline",          element: <PipelineBoard /> },
      { path: "tasks",             element: <TaskList /> },
      { path: "settings",          element: <SettingsStages /> },
      { path: "reports",           element: <Reports /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
