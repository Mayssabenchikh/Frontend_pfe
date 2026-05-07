import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import type { ExplanationContent } from "./dashboardExplanations";
import "./ExplanationTooltip.css";

interface ExplanationTooltipProps {
  explanation: ExplanationContent | null;
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * Tooltip component for dashboard explanations
 * Displays comprehensive information on hover or click
 */
export function ExplanationTooltip({ explanation, position = "top" }: ExplanationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!explanation) return null;

  return (
    <div className="explanation-tooltip-wrapper">
      <button
        className="explanation-tooltip-icon"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        title="Cliquez pour en savoir plus"
        aria-label="Information"
        type="button"
      >
        <FontAwesomeIcon icon={faCircleInfo} size="sm" />
      </button>

      {isOpen && (
        <div className={`explanation-tooltip explanation-tooltip-${position}`} role="tooltip">
          <div className="explanation-tooltip-header">
            <h4 className="explanation-tooltip-title">{explanation.title}</h4>
          </div>

          <div className="explanation-tooltip-body">
            <div className="explanation-section">
              <div className="explanation-label">📌 À quoi ça sert ?</div>
              <div className="explanation-text">{explanation.purpose}</div>
            </div>

            <div className="explanation-section">
              <div className="explanation-label">📊 Qu'est-ce que ça mesure ?</div>
              <div className="explanation-text">{explanation.measures}</div>
            </div>

            <div className="explanation-section">
              <div className="explanation-label">🔍 Comment l'interpréter ?</div>
              <div className="explanation-text">{explanation.interpretation}</div>
            </div>

            <div className="explanation-section">
              <div className="explanation-label">⭐ Pourquoi c'est important ?</div>
              <div className="explanation-text">{explanation.importance}</div>
            </div>

            <div className="explanation-section explanation-section-last">
              <div className="explanation-label">🎯 Quelle action prendre ?</div>
              <div className="explanation-text">{explanation.actions}</div>
            </div>
          </div>

          <div className="explanation-tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
