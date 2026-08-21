import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Home from "./pages/Home";
import Awards from "./pages/Awards";
import Articles from "./pages/Articles";
import Access from "./pages/Access";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ActivityLog from "./pages/admin/ActivityLog";
import Resources from "./pages/admin/Resources";
import Members from "./pages/admin/Members";
import Forum from "./pages/admin/Forum";
import AdminArticles from "./pages/admin/Articles";

function App() {
  return (
    <>
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/register" element={<Access />} />
          <Route path="/signin" element={<Access />} />
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
            <Route path="members" element={<Members />} />
            <Route path="forum" element={<Forum />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
