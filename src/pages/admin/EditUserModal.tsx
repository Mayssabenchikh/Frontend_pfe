import type { UserListDto, AdminRole, FlashMessage } from "./types";
import { ROLE_OPTIONS, MESSAGES } from "./constants";
import { IconClose } from "./icons";

type Props = {
  user: UserListDto;
  firstName: string;
  lastName: string;
  role: AdminRole;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  onRoleChange: (v: AdminRole) => void;
  message: FlashMessage | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function EditUserModal({
  user,
  firstName,
  lastName,
  role,
  onFirstNameChange,
  onLastNameChange,
  onRoleChange,
  message,
  loading,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div
      className="admin-dashboard__modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edit-title"
    >
      <div className="admin-dashboard__modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="admin-dashboard__modal-header">
          <h2 id="modal-edit-title" className="admin-dashboard__modal-title">
            Modifier : {user.email}
          </h2>
          <button type="button" className="admin-dashboard__modal-close" onClick={onClose} aria-label={MESSAGES.close}>
            <IconClose />
          </button>
        </div>
        <div className="admin-dashboard__modal-body">
          <form className="admin-dashboard__form" onSubmit={onSubmit}>
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="edit-firstName">
                Prénom
              </label>
              <input
                id="edit-firstName"
                type="text"
                className="admin-dashboard__input"
                value={firstName}
                onChange={(e) => onFirstNameChange(e.target.value)}
                required
              />
            </div>
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="edit-lastName">
                Nom
              </label>
              <input
                id="edit-lastName"
                type="text"
                className="admin-dashboard__input"
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                required
              />
            </div>
            <div className="admin-dashboard__field">
              <label className="admin-dashboard__label" htmlFor="edit-role">
                Rôle
              </label>
              <select
                id="edit-role"
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
            <div className="admin-dashboard__modal-footer">
              <button type="button" className="admin-dashboard__btn admin-dashboard__btn--secondary" onClick={onClose}>
                {MESSAGES.cancel}
              </button>
              <button type="submit" className="admin-dashboard__btn admin-dashboard__btn--primary" disabled={loading}>
                {loading ? MESSAGES.submit : MESSAGES.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
