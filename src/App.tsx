import { useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleRedirect from "./components/RoleRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ProjectsList } from "./pages/manager/ProjectsList";
import { ProjectDetail } from "./pages/manager/ProjectDetail";
import { ManagerProfile } from "./pages/manager/ManagerProfile";
import EmployeePage from "./pages/EmployeePage";

function App() {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (!initialized) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("kc_action_status") || params.get("kc_actionStatus");
    const action = params.get("kc_action");

    // Après un reset / update password via lien email,
    // on force la déconnexion pour revenir à l'écran de connexion.
    if (status && status.toLowerCase() === "success" && keycloak.authenticated && action && action.toUpperCase() === "UPDATE_PASSWORD") {
      keycloak.logout({ redirectUri: `${window.location.origin}/` });
    }
  }, [initialized, keycloak]);

  if (!initialized) {
    return null;
  }

  const handleLogin = () =>
    keycloak.login({ redirectUri: `${window.location.origin}/` });

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            !keycloak.authenticated ? (
              <div className="p-6 font-sans">
                <h1 className="text-2xl font-bold">Skillify</h1>
                <button
                  onClick={handleLogin}
                  className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-base font-medium text-white hover:bg-indigo-700"
                >
                  Connexion
                </button>
              </div>
            ) : (
              <RoleRedirect />
            )
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <ManagerPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "EMPLOYEE"]}>
              <EmployeePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
