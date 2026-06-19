import apiFetch from "./client";

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export const fetchCategories = () => {
  return apiFetch<CategoryResponse[]>("/catalog/categories", {
    method: "GET",
  });
};
