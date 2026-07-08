import { lazy, Suspense } from 'react'
import BottomNav from "./components/BottomNav";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Sidebar from "./components/Sidebar";
import RightPanel from "./components/RightPanel";
import HomePage from "./pages/HomePage";
import { PullToRefresh } from "./components/PullToRefresh";

const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const KesfetPage = lazy(() => import("./pages/KesfetPage"));
const HashtagPage = lazy(() => import("./pages/HashtagPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const PrivacySettingsPage = lazy(() => import("./pages/PrivacySettingsPage"));
const BlockedAccountsPage = lazy(() => import("./pages/BlockedAccountsPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const DeleteAccountPage = lazy(() => import("./pages/DeleteAccountPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage"));
const SavedPostsPage = lazy(() => import("./pages/SavedPostsPage"));

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

function App () {
  const {user, loading} = useAuth()

  if(loading) return <FullScreenLoader />

  return (
    <BrowserRouter>
    <Routes>
<Route path="/giris" element={!user ? <LoginPage /> : <Navigate to="/" />} />
<Route path="/kayit" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
<Route path="/sifremi-unuttum" element={<ForgotPasswordPage />} />
<Route path="/sifre-sifirla" element={<ResetPasswordPage />} />

<Route path="/*" element={user ? (
  <PullToRefresh>
  <div className="bg-gray-950 min-h-screen text-white flex pb-16 md:pb-0">
    <div className="hidden md:block">
        <Sidebar />
    </div>
    <Suspense fallback={<PageLoader />}>
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profil/:username" element={<ProfilePage />} />
          <Route path="/profil-duzenle" element={<EditProfilePage />} />
          <Route path="/gonderi/:postId" element={<PostDetailPage />} />
          <Route path="/kaydedilenler" element={<SavedPostsPage />} />
          <Route path="/bildirimler" element={<NotificationsPage />} />
          <Route path="/mesajlar" element={<MessagesPage />} />
          <Route path="/mesajlar/:username" element={<ChatPage />} />
          <Route path="/kesfet" element={<KesfetPage />} />
          <Route path="/kesfet/hashtag/:tag" element={<HashtagPage />} />
          <Route path="/ayarlar" element={<SettingsPage />} />
          <Route path="/ayarlar/sifre" element={<ChangePasswordPage />} />
          <Route path="/ayarlar/bildirimler" element={<NotificationSettingsPage />} />
          <Route path="/ayarlar/gizlilik" element={<PrivacySettingsPage />} />
          <Route path="/ayarlar/engellenenler" element={<BlockedAccountsPage />} />
          <Route path="/ayarlar/yardim" element={<HelpCenterPage />} />
          <Route path="/ayarlar/hakkinda" element={<AboutPage />} />
          <Route path="/ayarlar/hesabi-sil" element={<DeleteAccountPage />} />
      </Routes>
    </Suspense>
    <div className="hidden md:block">
        <RightPanel />
    </div>
    <BottomNav />
</div>
  </PullToRefresh>
) : <Navigate to="/giris" />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App