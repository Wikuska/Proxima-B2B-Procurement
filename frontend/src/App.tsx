import type { Location } from "react-router-dom";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthModal from "./components/auth/AuthModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import {
  AuthPage,
  CartPage,
  CheckoutConfirmationPage,
  CheckoutPage,
  CompanyPage,
  ContactPage,
  HomePage,
  ProductDetailsPage,
  ProductsPage,
  ProfilePage,
  VerifyEmailPage,
} from "./pages";
import CompanyAddressesTab from "./pages/company/CompanyAddressesTab";
import CompanyMembersTab from "./pages/company/CompanyMembersTab";
import CompanyOrdersTab from "./pages/company/CompanyOrdersTab";
import CompanyOverviewTab from "./pages/company/CompanyOverviewTab";
import CompanySettingsTab from "./pages/company/CompanySettingsTab";
import JoinRequestsTab from "./pages/company/JoinRequestsTab";
import OrderDetailPage from "./pages/profile/OrderDetailPage";
import OrdersTab from "./pages/profile/OrdersTab";
import CompanyAffiliationTab from "./pages/profile/CompanyAffiliationTab";

export default function App() {
  const location = useLocation();
  const backgroundLocation = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<ProductsPage />} />
          <Route path="/catalog/:categorySlug" element={<ProductsPage />} />
          <Route
            path="/product/:productSlug"
            element={<ProductDetailsPage />}
          />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/confirmation/:orderId"
            element={
              <ProtectedRoute>
                <CheckoutConfirmationPage />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="company-affiliation" replace />}
            />
            <Route
              path="company-affiliation"
              element={<CompanyAffiliationTab />}
            />
            <Route path="orders" element={<OrdersTab />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
          </Route>
        </Route>

        {/* Company dashboard — standalone app shell, no site NavBar/footer */}
        <Route
          path="/company"
          element={
            <ProtectedRoute allow={["COMPANY_ADMIN", "ADMIN"]}>
              <CompanyPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<CompanyOverviewTab />} />
          <Route path="orders" element={<CompanyOrdersTab />} />
          <Route path="members" element={<CompanyMembersTab />} />
          <Route path="addresses" element={<CompanyAddressesTab />} />
          <Route path="requests" element={<JoinRequestsTab />} />
          <Route path="settings" element={<CompanySettingsTab />} />
        </Route>
      </Routes>

      {/* Rendered as an overlay on top of the background location above,
          giving /auth its own addressable URL without leaving the page
          behind it (see AuthModal). */}
      {backgroundLocation && (
        <Routes>
          <Route path="/auth" element={<AuthModal />} />
        </Routes>
      )}
    </>
  );
}
