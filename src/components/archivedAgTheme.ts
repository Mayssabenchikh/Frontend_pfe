export const ARCHIVED_AG_THEME = `
  .ag-theme-archived {
    --ag-background-color: #f8f7ff;
    --ag-header-background-color: rgba(139,92,246,0.06);
    --ag-odd-row-background-color: #f8f7ff;
    --ag-even-row-background-color: #f8f7ff;
    --ag-row-hover-color: #ede9fe;
    --ag-selected-row-background-color: #ede9fe;
    --ag-border-color: #e5e1f8;
    --ag-header-foreground-color: #4c1d95;
    --ag-font-size: 14px;
    --ag-cell-horizontal-padding: 20px;
    --ag-row-height: 60px;
    --ag-header-height: 44px;
    --ag-borders: none;
    --ag-row-border-style: solid;
    --ag-row-border-width: 1px;
    --ag-row-border-color: #ede9fe;
    --ag-header-column-separator-display: none;
  }

  .ag-theme-archived .ag-root-wrapper {
    border: none;
    border-radius: 0;
  }

  .ag-theme-archived .ag-header {
    border-bottom: 1px solid #ddd6fe;
  }

  .ag-theme-archived .ag-header-cell-label {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #5b21b6;
  }

  .ag-theme-archived .ag-header-cell:hover .ag-header-cell-label {
    color: #3b0764;
  }

  .ag-theme-archived .ag-row {
    transition: background 0.15s ease;
  }

  .ag-theme-archived .ag-row:last-child {
    border-bottom: none;
  }

  .ag-theme-archived .ag-cell {
    display: flex !important;
    align-items: center !important;
    line-height: normal !important;
  }

  .ag-theme-archived .ag-cell-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .ag-theme-archived .ag-paging-panel {
    border-top: 1px solid rgba(139,92,246,0.1);
    background: rgba(139,92,246,0.04);
    color: #5b21b6;
    font-size: 12px;
    font-weight: 500;
    padding: 0 20px;
    height: 44px;
  }

  .ag-theme-archived .ag-paging-button {
    color: #5b21b6;
  }

  .ag-theme-archived .ag-paging-button:hover:not(:disabled) {
    color: #3b0764;
    background: #ede9fe;
    border-radius: 6px;
  }

  .ag-theme-archived .ag-sort-indicator-icon {
    color: #7c3aed;
  }
`;

