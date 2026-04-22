// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@/components/ToastProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import GlobalProgressBar from "@/components/GlobalProgressBar";
import GlobalModal from "@/components/ui/GlobalModal";
import SessionSyncProvider from "@/components/SessionSyncProvider";

// Pages
import LandingPage from "@/pages/LandingPage";
import RegisterPage from "@/pages/RegisterPage";
import AlumniRegisterPage from "@/pages/AlumniRegisterPage";
import Login from "@/pages/Login";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import AdminSetupPassword from "@/pages/AdminSetupPassword";
import AdminDashboard from "@/pages/AdminDashboard";
import UserPortal from "@/pages/UserPortal";
import AlumniPortal from "@/pages/AlumniPortal";
import UserMemoryProfile from "@/pages/UserMemoryProfile";
import PublicCard from "@/pages/PublicCard";
import ResetPassword from "@/pages/ResetPassword";
import UserSetupPassword from "@/pages/UserSetupPassword";
import QrLogin from "@/pages/QrLogin";

export default function App() {
  return (
    <HelmetProvider>
      <ToastProvider>
        <GlobalProgressBar />
        <GlobalModal />
        <SessionSyncProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/alumni" element={<AlumniRegisterPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/card/:slug" element={<PublicCard />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup-password" element={<UserSetupPassword />} />
              <Route path="/qr/:qr_hash" element={<QrLogin />} />

              {/* Super Admin */}
              <Route path="/super-admin" element={<SuperAdminLogin />} />
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["super_admin"]}
                    redirectTo="/super-admin"
                  />
                }
              >
                <Route
                  path="/super-admin/dashboard"
                  element={<SuperAdminDashboard />}
                />
              </Route>

              {/* Admin (keep /admin/login as redirect) */}
              <Route
                path="/admin/login"
                element={<Navigate to="/login" replace />}
              />
              <Route
                path="/admin/setup-password"
                element={<AdminSetupPassword />}
              />
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["admin"]}
                    redirectTo="/login"
                  />
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              {/* User / Alumni Portals */}
              <Route path="/portal" element={<UserPortal />} />
              <Route path="/alumni" element={<AlumniPortal />} />
              <Route path="/alumni-demo" element={<AlumniPortal />} />
              <Route
                path="/memories/:user_id"
                element={<UserMemoryProfile />}
              />

              {/* Catch-all */}
              <Route
                path="*"
                element={
                  <div
                    style={{
                      minHeight: "100vh",
                      background: "var(--color-bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <h1
                        style={{
                          fontSize: 64,
                          fontWeight: 800,
                          color: "var(--color-brand)",
                          marginBottom: 8,
                        }}
                      >
                        404
                      </h1>
                      <p
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: 15,
                        }}
                      >
                        Page not found
                      </p>
                      <a
                        href="/"
                        style={{
                          color: "var(--color-brand)",
                          fontSize: 14,
                          marginTop: 12,
                          display: "inline-block",
                        }}
                      >
                        ← Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </SessionSyncProvider>
      </ToastProvider>
    </HelmetProvider>
  );
}
