import { Suspense, lazy, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import RoleRedirect from "./components/RoleRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import { LocationTracker } from "./components/LocationTracker";
import { TopLoadingBar } from "./components/TopLoadingBar";
import AdminPage from "./pages/AdminPage";
import ManagerPage from "./pages/ManagerPage";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import ProjectsList from "./pages/manager/ProjectsList";
import { ProjectDetail } from "./pages/manager/ProjectDetail";
import { ManagerMatchingHub } from "./pages/manager/ManagerMatchingHub";
import { ProjectTalentWorkspace } from "./pages/manager/ProjectTalentWorkspace";
import { ManagerCvExtraction, ManagerProfile } from "./pages/manager/ManagerProfile";
import { ManagerAssignmentsHistory } from "./pages/manager/ManagerAssignmentsHistory";
import { EmployeeLearningPrograms } from "./pages/employee/EmployeeLearningPrograms";
import { EmployeeLearningProgramPlayer } from "./pages/employee/EmployeeLearningProgramPlayer";
import { EmployeeLearningProgramQuiz } from "./pages/employee/EmployeeLearningProgramQuiz";
import EmployeePage from "./pages/EmployeePage";
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { EmployeeCvExtraction, EmployeeMyProfile } from "./pages/employee/EmployeeMyProfile";
import { EmployeeAssignments } from "./pages/employee/EmployeeAssignments";
import { EmployeeProjects } from "./pages/employee/EmployeeProjects";
import { EmployeeProjectDetail } from "./pages/employee/EmployeeProjectDetail";
import { EmployeeTrainingRecommendations } from "./pages/employee/EmployeeTrainingRecommendations";
import { UserDetailPage } from "./pages/UserDetailPage";
import { TrainingManagerPrograms } from "./pages/employee/TrainingManagerPrograms";
import { TrainingManagerProgramEditor } from "./pages/employee/TrainingManagerProgramEditor";
import TrainingManagerPage from "./pages/training-manager/TrainingManagerPage";
import { TrainingManagerDashboard } from "./pages/training-manager/TrainingManagerDashboard";
import { TrainingManagerSubmissions } from "./pages/training-manager/TrainingManagerSubmissions";
import { TrainingManagerProfile } from "./pages/training-manager/TrainingManagerProfile";
import ProjectChatPage from "./pages/chat/ProjectChatPage";
import ForumShell from "./pages/forum/ForumShell";
import { ForumPage } from "./pages/forum/ForumPage";
import { ForumPostDetailPage } from "./pages/forum/ForumPostDetailPage";
import { MyForumPostsPage } from "./pages/forum/MyForumPostsPage";
import { SavedForumPostsPage } from "./pages/forum/SavedForumPostsPage";

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

  const handleLogin = () => {
    try {
      sessionStorage.setItem("skillify_post_login_redirect", `${window.location.pathname}${window.location.search}${window.location.hash}`);
    } catch {
      // ignore
    }
    return keycloak.login({ redirectUri: ROOT_REDIRECT_URI });
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Chargement de l'interface...</div>}>
      <LocationTracker />
      <TopLoadingBar />
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
          path="/admin/*"
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
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="cv-extraction" element={<ManagerCvExtraction />} />
          <Route path="quiz" element={<EmployeeQuiz />} />
          <Route path="matching/:id/workspace" element={<ProjectTalentWorkspace />} />
          <Route path="matching/:id/matches" element={<Navigate to="../workspace" replace />} />
          <Route path="matching/:id/team" element={<Navigate to="../workspace" replace />} />
          <Route path="matching" element={<ManagerMatchingHub />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="assignments" element={<ManagerAssignmentsHistory />} />
          <Route
            path="training-recommendations"
            element={<EmployeeTrainingRecommendations basePath="/manager" />}
          />
          <Route path="learning-programs/play/:enrollmentUuid" element={<EmployeeLearningProgramPlayer />} />
          <Route path="learning-programs/quiz/:enrollmentUuid/:videoUuid" element={<EmployeeLearningProgramQuiz />} />
          <Route path="projects/:id/matches" element={<RedirectProjectMatchesToTalent />} />
          <Route path="projects/:id/team" element={<RedirectProjectTeamToTalent />} />
          <Route path="projects/:projectId/team/:employeeId" element={<UserDetailPage source="manager-project" />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="chat" element={<ProjectChatPage scope="manager" />} />
          <Route path="chat/:projectUuid" element={<ProjectChatPage scope="manager" />} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>
        <Route
          path="/forum"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "EMPLOYEE", "TRAINING_MANAGER"]}>
              <ForumShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<ForumPage />} />
          <Route path="feed" element={<ForumPage />} />
          <Route path="post/:postUuid" element={<ForumPostDetailPage />} />
          <Route path="my-posts" element={<MyForumPostsPage />} />
          <Route path="saved" element={<SavedForumPostsPage />} />
        </Route>
        <Route
          path="/training-manager"
          element={
            <ProtectedRoute allowedRoles={["TRAINING_MANAGER"]}>
              <TrainingManagerPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<TrainingManagerDashboard />} />
          <Route path="dashboard" element={<TrainingManagerDashboard />} />
          <Route path="programs" element={<TrainingManagerPrograms />} />
          <Route path="programs/:uuid" element={<TrainingManagerProgramEditor />} />
          <Route path="submissions" element={<TrainingManagerSubmissions />} />
          <Route path="profile" element={<TrainingManagerProfile />} />
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
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="cv-extraction" element={<EmployeeCvExtraction />} />
          <Route path="quiz" element={<EmployeeQuiz />} />
          <Route path="assignments" element={<EmployeeAssignments />} />
          <Route path="training-recommendations" element={<EmployeeTrainingRecommendations />} />
          <Route path="learning-programs" element={<EmployeeLearningPrograms />} />
          <Route path="learning-programs/play/:enrollmentUuid" element={<EmployeeLearningProgramPlayer />} />
          <Route path="learning-programs/quiz/:enrollmentUuid/:videoUuid" element={<EmployeeLearningProgramQuiz />} />
          <Route path="projects" element={<EmployeeProjects />} />
          <Route path="projects/:projectId/team/:employeeId" element={<UserDetailPage source="employee-project" />} />
          <Route path="projects/:id" element={<EmployeeProjectDetail />} />
          <Route path="chat" element={<ProjectChatPage scope="employee" />} />
          <Route path="chat/:projectUuid" element={<ProjectChatPage scope="employee" />} />
          <Route path="profile" element={<EmployeeMyProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
