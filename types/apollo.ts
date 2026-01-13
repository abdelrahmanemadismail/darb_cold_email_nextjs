/**
 * Apollo.io Script Types
 */

export interface ApolloSearchParams {
  personTitles?: string[];
  personLocations?: string[];
  companyLocations?: string[];
  employeeRanges?: string[];
  contactEmailStatus?: string[];
  page?: number;
  perPage?: number;
}

export interface ApolloScriptResult {
  totalCompanies: number;
  totalContacts: number;
  totalRawResults: number;
  pagesProcessed: number;
}

export interface ApolloConfig {
  configured: boolean;
  options: {
    commonTitles: string[];
    commonLocations: string[];
    headcountRanges: Array<{
      label: string;
      min: number;
      max: number;
    }>;
  };
}

export interface ApolloScriptRequest {
  personSeniorities?: string[];
  personLocations?: string[];
  personTitles?: string[];
  companyLocations?: string[];
  industries?: string[];
  companyHeadcountMin?: number;
  companyHeadcountMax?: number;
  maxPages?: number;
}

export interface ApolloScriptResponse {
  success: boolean;
  data: ApolloScriptResult;
  message: string;
}

export interface ApolloErrorResponse {
  error: string;
  message?: string;
}
