import { EmployeeLearningHub } from "../employee/EmployeeLearningHub";

export function ManagerLearningHub() {
  return (
    <EmployeeLearningHub
      basePath="/manager/learning"
      title="Catalogue Formations Employé"
      subtitle="Recommandations par compétences avec suivi de progression, accessibles au manager."
    />
  );
}
