import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DigitalRain from "./components/DigitalRain";
import ReportIssueButton from "./components/ReportIssueButton";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import RequireAdminSection from "./components/RequireAdminSection";
import RequireSuperAdmin from "./components/RequireSuperAdmin";
import Home from "./pages/Home";
import About from "./pages/About";
import Awards from "./pages/Awards";
import Articles from "./pages/Articles";
import Leaderboard from "./pages/Leaderboard";
import HallOfFame from "./pages/HallOfFame";
import Access from "./pages/Access";
import OlympiadRegister from "./pages/OlympiadRegister";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ActivityLog from "./pages/admin/ActivityLog";
import Resources from "./pages/admin/Resources";
import AdminOlympiadRegistrations from "./pages/admin/OlympiadRegistrations";
import Forum from "./pages/admin/Forum";
import AdminArticles from "./pages/admin/Articles";
import AdminSessionPhotos from "./pages/admin/SessionPhotos";
import AdminActivitySlideshow from "./pages/admin/ActivitySlideshow";
import AdminLeaderboards from "./pages/admin/Leaderboards";
import AdminAwards from "./pages/admin/Awards";
import AdminSiteSections from "./pages/admin/SiteSections";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminHallOfFame from "./pages/admin/HallOfFame";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminIssueReports from "./pages/admin/IssueReports";

function App() {
  return (
    <>
      <DigitalRain />
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/hall-of-fame" element={<HallOfFame />} />
          <Route path="/signin" element={<Access />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Intra Math Olympiad registration — not linked from anywhere
              in the UI, reachable only by this exact URL. */}
          <Route path="/intra-olympiad-registration-2027" element={<OlympiadRegister />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="activity-log"
              element={
                <RequireAdminSection section="activity_log">
                  <ActivityLog />
                </RequireAdminSection>
              }
            />
            <Route
              path="resources"
              element={
                <RequireAdminSection section="resources">
                  <Resources />
                </RequireAdminSection>
              }
            />
            <Route
              path="articles"
              element={
                <RequireAdminSection section="articles">
                  <AdminArticles />
                </RequireAdminSection>
              }
            />
            <Route
              path="session-photos"
              element={
                <RequireAdminSection section="session_photos">
                  <AdminSessionPhotos />
                </RequireAdminSection>
              }
            />
            <Route
              path="activity-slideshow"
              element={
                <RequireAdminSection section="activity_slideshow">
                  <AdminActivitySlideshow />
                </RequireAdminSection>
              }
            />
            <Route
              path="leaderboards"
              element={
                <RequireAdminSection section="leaderboards">
                  <AdminLeaderboards />
                </RequireAdminSection>
              }
            />
            <Route
              path="awards"
              element={
                <RequireAdminSection section="awards">
                  <AdminAwards />
                </RequireAdminSection>
              }
            />
            <Route
              path="olympiad-registrations"
              element={
                <RequireAdminSection section="olympiad_registrations">
                  <AdminOlympiadRegistrations />
                </RequireAdminSection>
              }
            />
            <Route
              path="forum"
              element={
                <RequireAdminSection section="forum">
                  <Forum />
                </RequireAdminSection>
              }
            />
            <Route
              path="site-sections"
              element={
                <RequireAdminSection section="site_sections">
                  <AdminSiteSections />
                </RequireAdminSection>
              }
            />
            <Route
              path="hall-of-fame"
              element={
                <RequireAdminSection section="hall_of_fame_entries">
                  <AdminHallOfFame />
                </RequireAdminSection>
              }
            />
            <Route
              path="testimonials"
              element={
                <RequireAdminSection section="testimonials">
                  <AdminTestimonials />
                </RequireAdminSection>
              }
            />
            <Route
              path="announcements"
              element={
                <RequireAdminSection section="announcements">
                  <AdminAnnouncements />
                </RequireAdminSection>
              }
            />
            <Route
              path="roles"
              element={
                <RequireSuperAdmin>
                  <AdminRoles />
                </RequireSuperAdmin>
              }
            />
            <Route
              path="issue-reports"
              element={
                <RequireSuperAdmin>
                  <AdminIssueReports />
                </RequireSuperAdmin>
              }
            />
          </Route>
        </Routes>
      </main>
      <Footer />
      <ReportIssueButton />
    </>
  );
}

export default App;
