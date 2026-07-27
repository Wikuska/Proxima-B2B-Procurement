import type { Location } from "react-router-dom";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuthModal from "./components/auth/AuthModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import {
  CartPage,
  CheckoutConfirmationPage,
  CheckoutFlow,
  CheckoutPaymentMockPage,
  CompanyAddressesTab,
  CompanyAffiliationTab,
  CompanyMembersTab,
  CompanyOrdersTab,
  CompanyOrderDetailPage,
  CompanyOverviewTab,
  CompanyPage,
  CompanySettingsTab,
  ContactPage,
  DeliveryPaymentStep,
  DetailsStep,
  HomePage,
  JoinRequestsTab,
  NotFoundPage,
  OrderDetailPage,
  OrdersTab,
  ProductDetailsPage,
  ProductsPage,
  ProfilePage,
  ShippingAddressesTab,
  SummaryStep,
} from "./pages";
import { DEFAULT_AUTH_BACKGROUND } from "./utils/openAuth";

export default function App() {
  const location = useLocation();
  const backgroundLocation = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation;

  const effectiveBackground =
    backgroundLocation ??
    (location.pathname === "/auth" ? DEFAULT_AUTH_BACKGROUND : undefined);

  return (
    <>
      <Routes location={effectiveBackground ?? location}>
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

          <Route
            path="/checkout/confirmation/:orderId"
            element={
              <ProtectedRoute>
                <CheckoutConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/payment/:orderId"
            element={
              <ProtectedRoute>
                <CheckoutPaymentMockPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutFlow />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="details" replace />} />
            <Route path="details" element={<DetailsStep />} />
            <Route path="delivery" element={<DeliveryPaymentStep />} />
            <Route path="summary" element={<SummaryStep />} />
            <Route path="*" element={<Navigate to="details" replace />} />
          </Route>

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
            <Route path="addresses" element={<ShippingAddressesTab />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
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
          <Route path="orders/:orderId" element={<CompanyOrderDetailPage />} />
          <Route path="members" element={<CompanyMembersTab />} />
          <Route path="addresses" element={<CompanyAddressesTab />} />
          <Route path="requests" element={<JoinRequestsTab />} />
          <Route path="settings" element={<CompanySettingsTab />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage standalone />} />
      </Routes>

      {location.pathname === "/auth" && (
        <Routes>
          <Route path="/auth" element={<AuthModal />} />
        </Routes>
      )}
    </>
  );
}
