import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DigitalRain from "./components/DigitalRain";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Home from "./pages/Home";
import Awards from "./pages/Awards";
import Articles from "./pages/Articles";
import Leaderboard from "./pages/Leaderboard";
import Access from "./pages/Access";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ActivityLog from "./pages/admin/ActivityLog";
import Resources from "./pages/admin/Resources";
import Members from "./pages/admin/Members";
import Forum from "./pages/admin/Forum";
import AdminArticles from "./pages/admin/Articles";
import AdminSessionPhotos from "./pages/admin/SessionPhotos";
import AdminLeaderboards from "./pages/admin/Leaderboards";
import AdminAwards from "./pages/admin/Awards";
import AdminSiteSections from "./pages/admin/SiteSections";

function App() {
  return (
    <>
      <DigitalRain />
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/register" element={<Access />} />
          <Route path="/signin" element={<Access />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="activity-log" element={<ActivityLog />} />
            <Route path="resources" element={<Resources />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="session-photos" element={<AdminSessionPhotos />} />
            <Route path="leaderboards" element={<AdminLeaderboards />} />
            <Route path="awards" element={<AdminAwards />} />
            <Route path="members" element={<Members />} />
            <Route path="forum" element={<Forum />} />
            <Route path="site-sections" element={<AdminSiteSections />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
