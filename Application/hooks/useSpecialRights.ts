import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface SpecialRightsResponse {
  special_rights: string[];
  total_count: number;
}

interface UseSpecialRightsOptions {
  address_area?: string;
  address_city?: string;
}

export function useSpecialRights(options: UseSpecialRightsOptions = {}) {
  const { address_area, address_city } = options;

  // URL 파라미터 구성
  const params = new URLSearchParams();
  if (address_area) params.append("address_area", address_area);
  if (address_city) params.append("address_city", address_city);

  const url = `/api/v1/auction-completed/special-rights/unique${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const { data, error, isLoading, mutate } = useSWR<SpecialRightsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5분간 중복 요청 방지
    }
  );

  return {
    specialRights: data?.special_rights || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error,
    mutate,
  };
}
