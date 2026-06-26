import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import {
  AuthPage,
  CompanyPage,
  HomePage,
  JoinCompanyPage,
  ProductDetailsPage,
  ProductsPage,
  VerifyEmailPage,
} from "./pages";
import CompanyMembersTab from "./pages/company/CompanyMembersTab";
import CompanyOrdersTab from "./pages/company/CompanyOrdersTab";
import JoinRequestsTab from "./pages/company/JoinRequestsTab";

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<ProductsPage />} />
        <Route path="/catalog/:categorySlug" element={<ProductsPage />} />
        <Route path="/product/:productSlug" element={<ProductDetailsPage />} />
        <Route
          path="/join-company"
          element={
            <ProtectedRoute>
              <JoinCompanyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company"
          element={
            <ProtectedRoute allow={["COMPANY_ADMIN", "ADMIN"]}>
              <CompanyPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="requests" replace />} />
          <Route path="requests" element={<JoinRequestsTab />} />
          <Route path="orders" element={<CompanyOrdersTab />} />
          <Route path="members" element={<CompanyMembersTab />} />
        </Route>
      </Route>
    </Routes>
  );
}
