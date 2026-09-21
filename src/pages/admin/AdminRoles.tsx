import { useEffect, useState } from "react";
import * as db from "../../lib/db";
import type { AdminAccount } from "../../lib/db";
import { ADMIN_SECTION_LABELS } from "../../lib/types";
import type { AdminSection } from "../../lib/types";
import { useAuth } from "../../context/AuthContext";

const SECTIONS = Object.keys(ADMIN_SECTION_LABELS) as AdminSection[];
const SUPER_ADMIN_EMAIL = "mdmuntasir.2029@gmail.com";

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export default function AdminRoles() {
  const { email: myEmail } = useAuth();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [permissions, setPermissions] = useState<{ email: string; section: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [adminList, permList] = await Promise.all([
        db.listAdmins(),
        db.listAdminPermissions(),
      ]);
      setAdmins(adminList);
      setPermissions(permList);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    setError("");
    try {
      await db.addAdmin(trimmed);
      setNewEmail("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} as an admin?`)) return;
    setError("");
    try {
      await db.removeAdmin(email);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function toggleSection(email: string, section: AdminSection, granted: boolean) {
    const key = `${email}:${section}`;
    setBusyKey(key);
    setError("");
    try {
      if (granted) {
        await db.revokeAdminSection(email, section);
      } else {
        await db.grantAdminSection(email, section);
      }
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <>
      <div className="admin-content-header">
        <div>
          <h2>Admin Roles</h2>
          <p>
            Add or remove admins and control which admin-panel sections each
            one can access. Restricted to {SUPER_ADMIN_EMAIL}.
          </p>
        </div>
      </div>

      {error && <div className="form-msg error">{error}</div>}

      <div className="panel">
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <input
            type="email"
            placeholder="newadmin@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1.5px solid #d3ead4",
            }}
          />
          <button className="btn btn-primary" type="submit">
            Add Admin
          </button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : admins.length === 0 ? (
          <div className="empty-state">No admins found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Added</th>
                  {SECTIONS.map((section) => (
                    <th key={section}>{ADMIN_SECTION_LABELS[section]}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const isSuperAdmin = a.email.toLowerCase() === SUPER_ADMIN_EMAIL;
                  const isSelf = a.email.toLowerCase() === myEmail?.toLowerCase();
                  return (
                    <tr key={a.email}>
                      <td>
                        {a.email}
                        {isSelf && " (you)"}
                      </td>
                      <td>{new Date(a.addedAt).toLocaleDateString()}</td>
                      {SECTIONS.map((section) => {
                        const granted =
                          isSuperAdmin ||
                          permissions.some(
                            (p) => p.email === a.email && p.section === section
                          );
                        const key = `${a.email}:${section}`;
                        return (
                          <td key={section} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={granted}
                              disabled={isSuperAdmin || busyKey === key}
                              onChange={() => toggleSection(a.email, section, granted)}
                            />
                          </td>
                        );
                      })}
                      <td>
                        {!isSuperAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemove(a.email)}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
