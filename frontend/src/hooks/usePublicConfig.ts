import { useQuery } from "@tanstack/react-query";
import { getPublicConfig } from "../api/config";

/**
 * Runtime flags from the backend. Portfolio mode is controlled only via
 * backend `.env` — never duplicate it on the frontend.
 */
export function usePublicConfig() {
  return useQuery({
    queryKey: ["publicConfig"],
    queryFn: getPublicConfig,
    staleTime: Infinity,
  });
}
