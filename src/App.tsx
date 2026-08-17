import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Home from "./pages/Home";
import Access from "./pages/Access";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ActivityLog from "./pages/admin/ActivityLog";
import Resources from "./pages/admin/Resources";
import Members from "./pages/admin/Members";
import Forum from "./pages/admin/Forum";

function App() {
  return (
    <>
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<Home />} />
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
