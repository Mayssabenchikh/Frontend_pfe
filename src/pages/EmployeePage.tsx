import { useKeycloak } from "@react-keycloak/web";
import { EmployeeProfile } from "./employee/EmployeeProfile";

export default function EmployeePage() {
  const { keycloak } = useKeycloak();
  const token = keycloak.tokenParsed as { given_name?: string; family_name?: string; email?: string } | undefined;
  const displayName = [token?.given_name, token?.family_name].filter(Boolean).join(" ") || token?.email || "Employé";

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-bold text-slate-800">Espace employé</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{displayName}</span>
          <button
            onClick={() => keycloak.logout({ redirectUri: `${window.location.origin}/` })}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-0">
        <EmployeeProfile />
      </main>
    </div>
  );
}
