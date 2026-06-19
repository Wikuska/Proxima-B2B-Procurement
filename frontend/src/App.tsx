import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
