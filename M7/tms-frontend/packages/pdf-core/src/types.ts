export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

export interface TableRow {
  [key: string]: string | number | undefined;
}

export interface TableConfig {
  columns: TableColumn[];
  rows: TableRow[];
  showTotals?: boolean;
}

export interface HeaderConfig {
  title: string;
  subtitle?: string;
  logoPath?: string;
  /** When true, renders company info right-aligned (documentPdfGenerator style).
   *  When false (default), renders compact left-aligned (receipt/shipment style). */
  rightAlignedCompanyInfo?: boolean;
  companyLines?: string[];
}

export interface FooterConfig {
  lines: string[];
}

export interface PageSetup {
  marginLeft?: number;
  marginRight?: number;
  bottomMargin?: number;
}
