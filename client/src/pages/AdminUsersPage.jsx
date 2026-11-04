import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "../services/adminApi";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { formatDateTime } from "../utils/formatters";

const ROLES = ["all", "user", "admin"];
const PAGE_SIZE = 15;

const RolePill = ({ role }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      role === "admin"
        ? "bg-purple-100 text-purple-700"
        : "bg-slate-100 text-slate-600"
    }`}
  >
    {role}
  </span>
);

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;

      const { data } = await adminApi.users(params);
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const updateRole = async (userId, newRole) => {
    try {
      const { data } = await adminApi.updateUserRole(userId, newRole);
      toast.success(data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update role");
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteUser(deleteTarget._id);
      toast.success("User deleted successfully");
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete user");
    }
  };

  return (
    <AdminShell title="Users" subtitle={`${total} registered customers — manage roles and accounts.`}>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="input-field max-w-xs py-2.5 text-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                roleFilter === r
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface overflow-x-auto p-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="spinner" />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                            {user.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{user.email}</td>
                    <td>
                      <RolePill role={user.role} />
                    </td>
                    <td className="text-slate-500 text-xs">{formatDateTime(user.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateRole(user._id, user.role === "admin" ? "user" : "admin")}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          {user.role === "admin" ? "Revoke admin" : "Make admin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="secondary-button py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
            className="secondary-button py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete user?"
        message={`This will permanently remove "${deleteTarget?.name}" and all their data. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
};

export default AdminUsersPage;
