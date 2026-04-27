import { Suspense, lazy, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import RoleRedirect from "./components/RoleRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import ProjectsList from "./pages/manager/ProjectsList";
import { ProjectDetail } from "./pages/manager/ProjectDetail";
import { ManagerMatchingHub } from "./pages/manager/ManagerMatchingHub";
import { ProjectTalentWorkspace } from "./pages/manager/ProjectTalentWorkspace";
import { ManagerProfile } from "./pages/manager/ManagerProfile";
import { ManagerAssignmentsHistory } from "./pages/manager/ManagerAssignmentsHistory";
import { ManagerLearningHub } from "./pages/manager/ManagerLearningHub";
import { ManagerLearningCourse } from "./pages/manager/ManagerLearningCourse";
import EmployeePage from "./pages/EmployeePage";
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { EmployeeMyProfile } from "./pages/employee/EmployeeMyProfile";
import { EmployeeAssignments } from "./pages/employee/EmployeeAssignments";
import { EmployeeProjects } from "./pages/employee/EmployeeProjects";
import { EmployeeProjectDetail } from "./pages/employee/EmployeeProjectDetail";
import { EmployeeLearningHub } from "./pages/employee/EmployeeLearningHub";
import { EmployeeLearningCourse } from "./pages/employee/EmployeeLearningCourse";

const EmployeeQuiz = lazy(() =>
  import("./pages/employee/EmployeeQuiz").then((module) => ({ default: module.EmployeeQuiz })),
);

const ROOT_REDIRECT_URI = `${window.location.origin}/`;
const UPDATE_PASSWORD_ACTION = "UPDATE_PASSWORD";
const KC_ACTION_STATUS_KEYS = ["kc_action_status", "kc_actionStatus"] as const;

function shouldLogoutAfterPasswordAction(params: URLSearchParams, isAuthenticated: boolean): boolean {
  const statusValue = KC_ACTION_STATUS_KEYS
    .map((key) => params.get(key))
    .find((value) => value !== null);
  const actionValue = params.get("kc_action");
  const normalizedStatus = statusValue?.toLowerCase();
  const normalizedAction = actionValue?.toUpperCase();

  return (
    Boolean(normalizedStatus) &&
    normalizedStatus === "success" &&
    isAuthenticated &&
    Boolean(normalizedAction) &&
    normalizedAction === UPDATE_PASSWORD_ACTION
  );
}

function RedirectProjectMatchesToTalent() {
  const { id } = useParams();
  return <Navigate to={`/manager/matching/${id}/workspace`} replace />;
}

function RedirectProjectTeamToTalent() {
  const { id } = useParams();
  return <Navigate to={`/manager/matching/${id}/workspace`} replace />;
}

function LoginLanding({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="p-6 font-sans">
      <h1 className="text-2xl font-bold">Skillify</h1>
      <button
        onClick={onLogin}
        className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-base font-medium text-white hover:bg-indigo-700"
      >
        Connexion
      </button>
    </div>
  );
}

function App() {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (!initialized) return;
    const params = new URLSearchParams(window.location.search);

    // Après un reset / update password via lien email,
    // on force la déconnexion pour revenir à l'écran de connexion.
    if (shouldLogoutAfterPasswordAction(params, Boolean(keycloak.authenticated))) {
      keycloak.logout({ redirectUri: ROOT_REDIRECT_URI });
    }
  }, [initialized, keycloak]);

  if (!initialized) {
    return null;
  }

  const handleLogin = () => keycloak.login({ redirectUri: ROOT_REDIRECT_URI });

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Chargement de l'interface...</div>}>
      <Routes>
        <Route
          path="/"
          element={
            !keycloak.authenticated ? (
              <LoginLanding onLogin={handleLogin} />
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
          <Route path="quiz" element={<EmployeeQuiz />} />
          <Route path="matching/:id/workspace" element={<ProjectTalentWorkspace />} />
          <Route path="matching/:id/matches" element={<Navigate to="../workspace" replace />} />
          <Route path="matching/:id/team" element={<Navigate to="../workspace" replace />} />
          <Route path="matching" element={<ManagerMatchingHub />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="assignments" element={<ManagerAssignmentsHistory />} />
          <Route path="learning" element={<ManagerLearningHub />} />
          <Route path="learning/course/:progressUuid" element={<ManagerLearningCourse />} />
          <Route path="projects/:id/matches" element={<RedirectProjectMatchesToTalent />} />
          <Route path="projects/:id/team" element={<RedirectProjectTeamToTalent />} />
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
        >
          <Route index element={<EmployeeDashboard />} />
          <Route path="quiz" element={<EmployeeQuiz />} />
          <Route path="assignments" element={<EmployeeAssignments />} />
          <Route path="learning" element={<EmployeeLearningHub />} />
          <Route path="learning/course/:progressUuid" element={<EmployeeLearningCourse />} />
          <Route path="projects" element={<EmployeeProjects />} />
          <Route path="projects/:id" element={<EmployeeProjectDetail />} />
          <Route path="profile" element={<EmployeeMyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
