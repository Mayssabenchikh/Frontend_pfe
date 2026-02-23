import type { AdminRole, FlashMessage } from "./types";
import { ROLE_OPTIONS, MESSAGES } from "./constants";
import { IconClose } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  onEmailChange: (v: string) => void;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onRoleChange: (v: AdminRole) => void;
  message: FlashMessage | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export function CreateUserModal({
  open,
  onClose,
  email,
  firstName,
  lastName,
  role,
  onEmailChange,
  onFirstNameChange,
  onLastNameChange,
  onRoleChange,
  message,
  loading,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="admin-dashboard__modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-create-title"
    >
      <div className="admin-dashboard__modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="admin-dashboard__modal-header">
          <h2 id="modal-create-title" className="admin-dashboard__modal-title">
            Nouvel utilisateur
          </h2>
          <button type="button" className="admin-dashboard__modal-close" onClick={onClose} aria-label={MESSAGES.close}>
            <IconClose />
          </button>
        </div>
        <form id="admin-form-create" className="admin-dashboard__form" onSubmit={onSubmit}>
          <div className="admin-dashboard__modal-body">
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="create-email">
                Email
              </label>
              <input
                id="create-email"
                type="email"
                className="admin-dashboard__input"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="prenom.nom@skilify.com"
                required
              />
            </div>
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="create-firstName">
                Prénom
              </label>
              <input
                id="create-firstName"
                type="text"
                className="admin-dashboard__input"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                required
              />
            </div>
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="create-lastName">
                Nom
              </label>
              <input
                id="create-lastName"
                type="text"
                className="admin-dashboard__input"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                required
              />
            </div>
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="create-role">
                Rôle
              </label>
              <select
                id="create-role"
                className="admin-dashboard__select"
                value={role}
                onChange={(e) => onRoleChange(e.target.value as AdminRole)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {message && (
              <p className={`admin-dashboard__message admin-dashboard__message--${message.type}`}>{message.text}</p>
            )}
          </div>
          <div className="admin-dashboard__modal-footer">
            <button type="button" className="admin-dashboard__btn admin-dashboard__btn--secondary" onClick={onClose}>
              {MESSAGES.cancel}
            </button>
            <button type="submit" className="admin-dashboard__btn admin-dashboard__btn--primary" disabled={loading}>
              {loading ? MESSAGES.submit : MESSAGES.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
