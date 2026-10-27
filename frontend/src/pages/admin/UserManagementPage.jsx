import { useUserManagerService } from '../../services/UserManagerService.jsx';
import '../../styles/admin-users.css';

function formatAccountCreatedAt(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export default function UserManagementPage() {
  const {
    users,
    pagination,
    selectedUser,
    roleToEdit,
    loading,
    saving,
    error,
    notice,
    isSelectedSelf,
    setRoleToEdit,
    selectUser,
    loadUsers,
    updateSelectedRole,
    deleteSelectedUser,
  } = useUserManagerService();

  return (
    <section className="admin-users-page">
        <div className="admin-users-heading">
          <div>
            <h1>Quản lý người dùng</h1>
            <p>Danh sách tài khoản và quyền truy cập hệ thống.</p>
          </div>
        </div>

        <div className="admin-users-toolbar">
          <span>{pagination.total} tài khoản</span>
          <div className="admin-user-actions">
            <label className="admin-role-editor">
              <span className="sr-only">Quyền mới</span>
              <select
                value={roleToEdit}
                onChange={(event) => setRoleToEdit(event.target.value)}
                disabled={!selectedUser || isSelectedSelf || saving}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button
              className={`admin-action-button admin-edit-button ${selectedUser && !isSelectedSelf ? 'is-available' : ''}`}
              onClick={updateSelectedRole}
              disabled={
                !selectedUser ||
                isSelectedSelf ||
                saving ||
                roleToEdit === selectedUser?.role?.toLowerCase()
              }
              type="button"
            >
              {saving ? 'Đang xử lý...' : 'Sửa quyền'}
            </button>
            <button
              className={`admin-action-button admin-delete-button ${selectedUser && !isSelectedSelf ? 'is-available' : ''}`}
              onClick={deleteSelectedUser}
              disabled={!selectedUser || isSelectedSelf || saving}
              type="button"
            >
              Xóa
            </button>
          </div>
        </div>

        {error && <p className="admin-users-message is-error" role="alert">{error}</p>}
        {notice && <p className="admin-users-message is-success" role="status">{notice}</p>}
        {isSelectedSelf && (
          <p className="admin-users-message">
            Không thể sửa quyền hoặc xóa tài khoản admin đang đăng nhập.
          </p>
        )}

        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th scope="col">STT</th>
                <th scope="col">Username</th>
                <th scope="col">Fullname</th>
                <th scope="col">Role</th>
                <th scope="col">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr
                  className="admin-users-empty-row"
                >
                  <td colSpan="5" className="admin-users-empty">Đang tải người dùng...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-users-empty">Không có người dùng nào.</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.accountId}
                    className={selectedUser?.accountId === user.accountId ? 'is-selected' : ''}
                    onClick={() => selectUser(user)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectUser(user);
                      }
                    }}
                    tabIndex={0}
                    aria-selected={selectedUser?.accountId === user.accountId}
                  >
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>{user.username || '—'}</td>
                    <td>{user.fullName || '—'}</td>
                    <td>
                      <span className={`admin-role-badge role-${user.role?.toLowerCase() || 'user'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td>{formatAccountCreatedAt(user.accountCreatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-users-pagination">
          <button
            className="admin-action-button"
            onClick={() => loadUsers(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
            type="button"
          >
            Trước
          </button>
          <span>
            Trang {pagination.page} / {Math.max(pagination.totalPages, 1)}
          </span>
          <button
            className="admin-action-button"
            onClick={() => loadUsers(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.totalPages}
            type="button"
          >
            Sau
          </button>
        </div>
    </section>
  );
}
