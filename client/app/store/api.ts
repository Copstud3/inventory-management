import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  ExpenseByCategorySummary,
  ExpenseSummary,
  NewProduct,
  Product,
  PurchaseSummary,
  SalesSummary,
  User,
} from "../types";

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "api",
  tagTypes: ["DashboardMetrics", "Products", "Users", "Expenses"],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),

    getProducts: build.query<Product[], string | void>({
      query: (search) => ({
        url: "/products",
        params: search ? { search } : {},
      }),
      providesTags: ["Products"],
    }),

    createProduct: build.mutation<Product, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products"],
    }),

    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"]
    }),

    getExpensesByCategory: build.query<ExpenseByCategorySummary[], void>({
      query: () => "/expenses",
      providesTags: ["Expenses"]
    })
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useGetUsersQuery,
  useGetExpensesByCategoryQuery,
  useCreateProductMutation,
} = api;
