import EditProfilePage from "./pages/EditProfilePage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Sidebar from "./components/Sidebar";
import RightPanel from "./components/RightPanel";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import KesfetPage from "./pages/KesfetPage";
import MessagesPage from "./pages/MessagesPage";

function App () {
  const {user, loading} = useAuth()

  if(loading) return <div style={{background: '07071a', minHeight: '100vh'}} />

  return (
    <BrowserRouter>
    <Routes>
<Route path="/giris" element={!user ? <LoginPage /> : <Navigate to="/" />} />
<Route path="/kayit" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

<Route path="/*" element={user ? (
  <div className="bg-gray-950 min-h-screen text-white flex">
<Sidebar />
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/profil/:username" element={<ProfilePage />} />
  <Route path="/profil-duzenle" element={<EditProfilePage />} />
  <Route path="/bildirimler" element={<NotificationsPage />} />
  <Route path="/mesajlar" element={<MessagesPage />} />
  <Route path="/kesfes" element={ <KesfetPage />} />
</Routes>
<RightPanel />
  </div>
) : <Navigate to="/giris" />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App