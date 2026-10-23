import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WelcomePage from "./pages/WelcomePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import { PullToRefresh } from "./components/PullToRefresh";
import AppLayout from "./components/AppLayout";

const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const BlockedAccountsPage = lazy(() => import("./pages/BlockedAccountsPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const SavedPostsPage = lazy(() => import("./pages/SavedPostsPage"));
const TopicPage = lazy(() => import("./pages/TopicPage"));
const NewQuestionPage = lazy(() => import("./pages/NewQuestionPage"));

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="text-purple-500 text-4xl font-bold animate-pulse">
          Flock
        </div>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/giris" replace />
}

function App () {
  const {user, loading} = useAuth()

  if(loading) return <FullScreenLoader />

  const needsOnboarding = !!user && !user.user_metadata?.username

  if (needsOnboarding) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
          <Route path="/kullanim-sartlari" element={<TermsPage />} />
          <Route path="/*" element={<WelcomePage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
    <Routes>
<Route path="/giris" element={!user ? <LoginPage /> : <Navigate to="/" />} />
<Route path="/kayit" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
<Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
<Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
<Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
<Route path="/kullanim-sartlari" element={<TermsPage />} />

<Route path="/*" element={
  <PullToRefresh>
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/konu/:slug" element={<TopicPage />} />
          <Route path="/gonderi/:postId" element={<PostDetailPage />} />
          <Route path="/profil/:username" element={<ProfilePage />} />

          <Route path="/yeni-soru" element={<RequireAuth><NewQuestionPage /></RequireAuth>} />
          <Route path="/profil-duzenle" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
          <Route path="/kaydedilenler" element={<RequireAuth><SavedPostsPage /></RequireAuth>} />
          <Route path="/bildirimler" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="/mesajlar" element={<RequireAuth><MessagesPage /></RequireAuth>} />
          <Route path="/mesajlar/:username" element={<RequireAuth><ChatPage /></RequireAuth>} />
          <Route path="/ayarlar" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/ayarlar/sifre" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
          <Route path="/ayarlar/bildirimler" element={<RequireAuth><NotificationSettingsPage /></RequireAuth>} />
          <Route path="/ayarlar/engellenenler" element={<RequireAuth><BlockedAccountsPage /></RequireAuth>} />
          <Route path="/ayarlar/yardim" element={<HelpCenterPage />} />
          <Route path="/ayarlar/hakkinda" element={<AboutPage />} />
          <Route path="/ayarlar/hesabi-sil" element={<RequireAuth><DeleteAccountPage /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  </PullToRefresh>
} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
