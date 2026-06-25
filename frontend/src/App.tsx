import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import {
  AuthPage,
  VerifyEmailPage,
  HomePage,
  ProductsPage,
  ProductDetailsPage,
} from "./pages";

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
      </Route>
    </Routes>
  );
}
