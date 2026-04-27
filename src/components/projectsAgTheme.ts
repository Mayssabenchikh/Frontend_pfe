export const PROJECTS_AG_THEME = `
  .ag-theme-projects {
    --ag-background-color: #ffffff;
    --ag-header-background-color: rgba(109,40,217,0.06);
    --ag-odd-row-background-color: #ffffff;
    --ag-row-hover-color: #f0f0ff;
    --ag-border-color: #e8edf5;
    --ag-header-foreground-color: #4c1d95;
    --ag-foreground-color: #0f172a;
    --ag-font-size: 14px;
    --ag-cell-horizontal-padding: 16px;
    --ag-row-height: 56px;
    --ag-header-height: 42px;
  }

  .ag-theme-projects .ag-header-cell-label {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #5b21b6;
  }

  .ag-theme-projects .ag-row {
    border-bottom: 1px solid #ede9fe;
  }

  .ag-theme-projects .ag-cell {
    display: flex !important;
    align-items: center !important;
    line-height: normal !important;
  }

  .ag-theme-projects .ag-cell-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .ag-theme-projects .ag-paging-panel {
    border-top: 1px solid rgba(109,40,217,0.12);
    background: rgba(109,40,217,0.04);
    color: #5b21b6;
    font-size: 12px;
    font-weight: 500;
  }

  @media (max-width: 767px) {
    .ag-theme-projects {
      --ag-font-size: 12px;
      --ag-cell-horizontal-padding: 10px;
      --ag-row-height: 52px;
      --ag-header-height: 40px;
    }
    .ag-theme-projects .ag-header-cell-label {
      font-size: 9.5px;
      letter-spacing: 0.06em;
    }
    .ag-theme-projects .ag-paging-panel {
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.35rem;
      row-gap: 0.2rem;
      padding: 0.45rem 0.3rem;
      font-size: 11px;
    }
  }
`;

