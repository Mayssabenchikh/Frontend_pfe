import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from "../../icons/heroicons/outline";
import { quizApi, type EmployeeSkillDto, type AttemptResultResponse } from "../../api/quizApi";
import { getSkillIconUrl } from "../admin/skillIcons";
import { AlertBanner } from "../../components/AlertBanner";

type SkillWithStats = EmployeeSkillDto & {
  lastResult?: AttemptResultResponse | null;
  isQuizAvailable: boolean;
  isCooldownActive: boolean;
};

function formatFrenchDate(iso?: string | null): string {
  if (!iso) return "À planifier";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function statusToFrench(status?: string | null): string {
  const raw = String(status ?? "").toUpperCase();
  if (raw === "VALIDATED") return "Validé";
  if (raw === "FAILED") return "Échoué";
  if (raw === "QUIZ_PENDING") return "Quiz en attente";
  if (raw === "EXTRACTED") return "Extrait";
  if (raw === "IN_PROGRESS") return "En cours";
  return raw || "Inconnu";
}

function formatSkillLevelLabel(
  level?: number | null,
  status?: string | null,
  validatedLevel?: number | null,
  targetLevel?: number | null,
): string {
  const numericLevel = Number.isFinite(level) ? Number(level) : 0;
  const validated = Number.isFinite(validatedLevel) ? Number(validatedLevel) : 0;
  const target = Number.isFinite(targetLevel) ? Number(targetLevel) : numericLevel;
  const rawStatus = String(status ?? "").toUpperCase();
  if (rawStatus === "EXTRACTED") {
    return "Niveau non évalué";
  }
  if (rawStatus === "QUIZ_PENDING") {
    if (validated > 0) {
      return `Validé N${validated} · Cible N${Math.max(validated, target)}`;
    }
    return `Niveau cible N${Math.max(1, target)}`;
  }
  if (numericLevel <= 0) {
    return "Niveau en attente";
  }
  return `Expertise Niveau ${numericLevel}`;
}

function isQuizCooldownActive(quizNextAllowedAt?: string | null): boolean {
  if (!quizNextAllowedAt) return false;
  const t = new Date(quizNextAllowedAt).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

function statusBadge(status: string) {
  const raw = String(status ?? "").toUpperCase();
  const label = statusToFrench(raw);
  if (raw === "VALIDATED") {
    return { label, className: "bg-emerald-100 text-emerald-700", bgClass: "bg-emerald-50" };
  }
  if (raw === "FAILED") {
    return { label, className: "bg-rose-100 text-rose-700", bgClass: "bg-rose-50" };
  }
  if (raw === "QUIZ_PENDING" || raw === "EXTRACTED") {
    return { label, className: "bg-amber-100 text-amber-700", bgClass: "bg-amber-50" };
  }
  return { label, className: "bg-slate-100 text-slate-700", bgClass: "bg-slate-50" };
}

function resolveSkillIconUrl(skill: EmployeeSkillDto): string | null {
  return skill.iconUrl || getSkillIconUrl(skill.skillName);
}

export function EmployeeQuizDashboard() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<SkillWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await quizApi.listEmployeeSkills();
        const data = Array.isArray(res.data) ? res.data : [];
        const enriched: SkillWithStats[] = data.map((skill) => ({
          ...skill,
          isQuizAvailable: true,
          isCooldownActive: isQuizCooldownActive(skill.quizNextAllowedAt),
        }));
        setSkills(enriched);
      } catch (e) {
        setError("Impossible de charger les compétences. Veuillez réessayer.");
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  // Separate skills into sections
  const [availableSkills, inProgressSkills, completedSkills] = useMemo(() => {
    const available = skills.filter((s) => !s.isCooldownActive);
    const inProgress = skills.filter((s) => statusToFrench(s.status) === "En cours" && s.isCooldownActive);
    const completed = skills.filter((s) => statusToFrench(s.status) === "Validé");
    return [available, inProgress, completed];
  }, [skills]);

  const handleStartQuiz = (skillUuid: string) => {
    navigate(`/employee/quiz?skill=${skillUuid}`);
  };

  return (
    <div
      className="flex min-h-full w-full flex-col overflow-auto"
      style={{ background: "#F4EFFA" }}
    >
      {/* Main content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        {error && <AlertBanner message={error} />}

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: "#2F184B" }}
          >
            Employee Quiz Dashboard
          </h1>
          <p className="mt-2 text-lg" style={{ color: "#532B88" }}>
            Suivez votre progression et développez vos compétences
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#9B72CF" }}></div>
            </div>
          </div>
        ) : (
          <>
            {/* Available Quiz Cards */}
            {availableSkills.length > 0 && (
              <section className="mb-8">
                <h2
                  className="mb-6 text-2xl font-bold"
                  style={{ color: "#2F184B" }}
                >
                  Quiz disponibles
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {availableSkills.map((skill) => {
                    const badge = statusBadge(skill.status);
                    const iconUrl = resolveSkillIconUrl(skill);
                    return (
                      <div
                        key={skill.skillUuid}
                        className="rounded-3xl border p-6 shadow-sm hover:shadow-md transition"
                        style={{
                          borderColor: "#C8B1E4",
                          background: "white",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0"
                            style={{ background: "#C8B1E4", color: "#2F184B" }}
                          >
                            {iconUrl ? (
                              <img src={iconUrl} alt="" className="h-7 w-7 object-contain" />
                            ) : (
                              <BoltIcon className="h-6 w-6" />
                            )}
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: badge.bgClass,
                              color: "#2F184B",
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <h3
                          className="text-lg font-bold mb-1"
                          style={{ color: "#2F184B" }}
                        >
                          {skill.skillName}
                        </h3>
                        <p
                          className="text-sm mb-4"
                          style={{ color: "#532B88" }}
                        >
                          {formatSkillLevelLabel(
                            skill.level,
                            skill.status,
                            skill.validatedLevel,
                            skill.targetLevel,
                          )}
                        </p>

                        <div className="flex gap-2 mb-4 text-xs" style={{ color: "#532B88" }}>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>15 min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <SparklesIcon className="h-4 w-4" />
                            <span>20 questions</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartQuiz(skill.skillUuid)}
                          className="w-full px-4 py-3 rounded-xl font-semibold text-white transition hover:opacity-90"
                          style={{ background: "#9B72CF" }}
                        >
                          Commencer
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* In Progress Section */}
            {inProgressSkills.length > 0 && (
              <section className="mb-8">
                <h2
                  className="mb-6 text-2xl font-bold"
                  style={{ color: "#2F184B" }}
                >
                  À reprendre
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressSkills.map((skill) => {
                    const iconUrl = resolveSkillIconUrl(skill);
                    return (
                      <div
                        key={skill.skillUuid}
                        className="rounded-3xl border p-6 shadow-sm hover:shadow-md transition"
                        style={{
                          borderColor: "#C8B1E4",
                          background: "white",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0"
                            style={{ background: "#C8B1E4", color: "#2F184B" }}
                          >
                            {iconUrl ? (
                              <img src={iconUrl} alt="" className="h-7 w-7 object-contain" />
                            ) : (
                              <BoltIcon className="h-6 w-6" />
                            )}
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: "#FEF08A",
                              color: "#854D0E",
                            }}
                          >
                            En cours
                          </span>
                        </div>

                        <h3
                          className="text-lg font-bold mb-1"
                          style={{ color: "#2F184B" }}
                        >
                          {skill.skillName}
                        </h3>
                        <p
                          className="text-sm mb-4"
                          style={{ color: "#DC2626" }}
                        >
                          Prochaine tentative: {formatFrenchDate(skill.quizNextAllowedAt)}
                        </p>

                        <button
                          disabled
                          className="w-full px-4 py-3 rounded-xl font-semibold text-white transition opacity-60 cursor-not-allowed"
                          style={{ background: "#C8B1E4" }}
                        >
                          Cooldown en cours
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Completed Section */}
            {completedSkills.length > 0 && (
              <section className="mb-8">
                <h2
                  className="mb-6 text-2xl font-bold"
                  style={{ color: "#2F184B" }}
                >
                  Compétences validées
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {completedSkills.map((skill) => {
                    const iconUrl = resolveSkillIconUrl(skill);
                    return (
                      <div
                        key={skill.skillUuid}
                        className="rounded-3xl border p-6 shadow-sm"
                        style={{
                          borderColor: "#C8B1E4",
                          background: "white",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0"
                            style={{ background: "#C8B1E4", color: "#2F184B" }}
                          >
                            {iconUrl ? (
                              <img src={iconUrl} alt="" className="h-7 w-7 object-contain" />
                            ) : (
                              <BoltIcon className="h-6 w-6" />
                            )}
                          </div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1"
                            style={{
                              background: "#DBEAFE",
                              color: "#0369A1",
                            }}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Validé
                          </span>
                        </div>

                        <h3
                          className="text-lg font-bold mb-1"
                          style={{ color: "#2F184B" }}
                        >
                          {skill.skillName}
                        </h3>
                        <p
                          className="text-sm mb-4"
                          style={{ color: "#532B88" }}
                        >
                          Niveau validé: <strong>{skill.validatedLevel ?? skill.level}</strong>
                        </p>

                        <button
                          onClick={() => handleStartQuiz(skill.skillUuid)}
                          className="w-full px-4 py-3 rounded-xl font-semibold transition"
                          style={{
                            background: "#E9D5FF",
                            color: "#2F184B",
                            border: `1px solid #9B72CF`,
                          }}
                        >
                          Refaire le quiz
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty State */}
            {skills.length === 0 && !loading && (
              <div
                className="rounded-3xl border p-12 text-center"
                style={{
                  borderColor: "#C8B1E4",
                  background: "white",
                }}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "#C8B1E4", color: "#2F184B" }}
                  >
                    <SparklesIcon className="h-8 w-8" />
                  </div>
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "#2F184B" }}
                >
                  Aucune compétence disponible
                </h3>
                <p style={{ color: "#532B88" }}>
                  Vos compétences seront affichées ici une fois configurées.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
