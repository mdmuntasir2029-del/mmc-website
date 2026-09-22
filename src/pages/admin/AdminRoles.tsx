import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as db from "../../lib/db";
import type { AdminAccount, AdminRole } from "../../lib/db";
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
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{ roleId: string; section: string }[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<{ email: string; roleId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [adminList, permList, roleList, rolePermList, roleAssignList] = await Promise.all([
        db.listAdmins(),
        db.listAdminPermissions(),
        db.listAdminRoles(),
        db.listAdminRolePermissions(),
        db.listAdminRoleAssignments(),
      ]);
      setAdmins(adminList);
      setPermissions(permList);
      setRoles(roleList);
      setRolePermissions(rolePermList);
      setRoleAssignments(roleAssignList);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
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
    const key = `perm:${email}:${section}`;
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

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    setError("");
    try {
      await db.createAdminRole(trimmed);
      setNewRoleName("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDeleteRole(roleId: string, name: string) {
    if (!confirm(`Delete the "${name}" role? Admins assigned it will lose the sections it granted.`)) return;
    setError("");
    try {
      await db.deleteAdminRole(roleId);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function toggleRoleSection(roleId: string, section: AdminSection, granted: boolean) {
    const key = `role-perm:${roleId}:${section}`;
    setBusyKey(key);
    setError("");
    try {
      if (granted) {
        await db.revokeAdminRoleSection(roleId, section);
      } else {
        await db.grantAdminRoleSection(roleId, section);
      }
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleRoleAssignment(email: string, roleId: string, assigned: boolean) {
    const key = `role-assign:${email}:${roleId}`;
    setBusyKey(key);
    setError("");
    try {
      if (assigned) {
        await db.unassignAdminRole(email, roleId);
      } else {
        await db.assignAdminRole(email, roleId);
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
            Add, remove, or edit individual admins' access, and create
            reusable roles to assign the same set of sections to multiple
            admins at once. Restricted to {SUPER_ADMIN_EMAIL}.
          </p>
        </div>
      </div>

      {error && <div className="form-msg error">{error}</div>}

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Admins</h3>
        </div>
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
                        const key = `perm:${a.email}:${section}`;
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

      <div className="panel">
        <div className="panel-title-row">
          <h3 style={{ margin: 0 }}>Roles</h3>
        </div>
        <p style={{ marginTop: 0 }}>
          Create a reusable role (e.g. "Content Editor"), choose which
          sections it grants, then assign it to any admin below — an
          admin's access is the union of their direct checkboxes above and
          every role assigned to them.
        </p>
        <form onSubmit={handleCreateRole} style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <input
            type="text"
            placeholder="e.g. Content Editor"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1.5px solid #d3ead4",
            }}
          />
          <button className="btn btn-primary" type="submit">
            Create Role
          </button>
        </form>

        {roles.length === 0 ? (
          <div className="empty-state">No roles created yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  {SECTIONS.map((section) => (
                    <th key={section}>{ADMIN_SECTION_LABELS[section]}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    {SECTIONS.map((section) => {
                      const granted = rolePermissions.some(
                        (rp) => rp.roleId === r.id && rp.section === section
                      );
                      const key = `role-perm:${r.id}:${section}`;
                      return (
                        <td key={section} style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={granted}
                            disabled={busyKey === key}
                            onChange={() => toggleRoleSection(r.id, section, granted)}
                          />
                        </td>
                      );
                    })}
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteRole(r.id, r.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {roles.length > 0 && (
        <div className="panel">
          <div className="panel-title-row">
            <h3 style={{ margin: 0 }}>Assign Roles to Admins</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  {roles.map((r) => (
                    <th key={r.id}>{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins
                  .filter((a) => a.email.toLowerCase() !== SUPER_ADMIN_EMAIL)
                  .map((a) => (
                    <tr key={a.email}>
                      <td>{a.email}</td>
                      {roles.map((r) => {
                        const assigned = roleAssignments.some(
                          (ra) => ra.email === a.email && ra.roleId === r.id
                        );
                        const key = `role-assign:${a.email}:${r.id}`;
                        return (
                          <td key={r.id} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={assigned}
                              disabled={busyKey === key}
                              onChange={() => toggleRoleAssignment(a.email, r.id, assigned)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
