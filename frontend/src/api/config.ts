import apiFetch from "./client";

export interface PublicConfig {
  portfolio_mode: boolean;
  portfolio_verification_code: string | null;
}

export const getPublicConfig = () => {
  return apiFetch<PublicConfig>("/config/public");
};
