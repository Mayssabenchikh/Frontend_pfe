type Props = {
  total: number;
  actifs: number;
  inactifs: number;
};

export function AdminStats({ total, actifs, inactifs }: Props) {
  return (
    <div className="admin-dashboard__stats">
      <div className="admin-dashboard__stat-card admin-dashboard__stat-card--primary">
        <p className="admin-dashboard__stat-label">Total utilisateurs</p>
        <p className="admin-dashboard__stat-value">{total}</p>
      </div>
      <div className="admin-dashboard__stat-card admin-dashboard__stat-card--success">
        <p className="admin-dashboard__stat-label">Comptes actifs</p>
        <p className="admin-dashboard__stat-value">{actifs}</p>
      </div>
      <div className="admin-dashboard__stat-card admin-dashboard__stat-card--teal">
        <p className="admin-dashboard__stat-label">Comptes inactifs</p>
        <p className="admin-dashboard__stat-value">{inactifs}</p>
      </div>
    </div>
  );
}
