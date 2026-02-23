import { useKeycloak } from "@react-keycloak/web";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleRedirect from "./components/RoleRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import EmployeePage from "./pages/EmployeePage";

function App() {
  const { keycloak, initialized } = useKeycloak();

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
              <div style={{ fontFamily: "system-ui", padding: 24 }}>
                <h1>Skillify</h1>
                <button
                  onClick={handleLogin}
                  style={{ padding: "10px 20px", fontSize: "16px" }}
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
        />
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
