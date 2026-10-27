import { useCallback, useEffect, useState } from 'react';
import adminUserRepository from '../repositories/admin/adminUserRepository';

const PAGE_SIZE = 20;

const INITIAL_PAGINATION = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

function readCurrentAccountId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const id = user?.accountId ?? user?.account_id ?? user?.id;
    return id == null ? null : Number(id);
  } catch (error) {
    console.error('Không thể đọc thông tin tài khoản hiện tại:', error);
    return null;
  }
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export function useUserManagerService() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [roleToEdit, setRoleToEdit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const currentAccountId = readCurrentAccountId();
  const selectedUser = users.find((user) => user.accountId === selectedAccountId) ?? null;
  const isSelectedSelf = selectedUser?.accountId === currentAccountId;

  const applyUsersResult = useCallback((result) => {
    setUsers(result.users);
    setPagination(result.pagination);
    setSelectedAccountId((selectedId) =>
      result.users.some((user) => user.accountId === selectedId) ? selectedId : null,
    );
  }, []);

  const loadUsers = useCallback(async (page = pagination.page) => {
    setLoading(true);
    setError('');

    try {
      const result = await adminUserRepository.getAll({ page, limit: PAGE_SIZE });
      applyUsersResult(result);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Không thể tải danh sách người dùng. Hãy kiểm tra đăng nhập và quyền admin.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [applyUsersResult, pagination.page]);

  useEffect(() => {
    let isMounted = true;

    adminUserRepository.getAll({ page: 1, limit: PAGE_SIZE })
      .then((result) => {
        if (isMounted) applyUsersResult(result);
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(
            getErrorMessage(
              requestError,
              'Không thể tải danh sách người dùng. Hãy kiểm tra đăng nhập và quyền admin.',
            ),
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applyUsersResult]);

  const selectUser = useCallback((user) => {
    setSelectedAccountId(user.accountId);
    setRoleToEdit(user.role?.toLowerCase() || 'user');
    setError('');
    setNotice('');
  }, []);

  const updateSelectedRole = useCallback(async () => {
    if (!selectedUser || isSelectedSelf) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await adminUserRepository.updateRole(selectedUser.accountId, roleToEdit);
      setNotice(`Đã cập nhật quyền cho ${selectedUser.username || selectedUser.email}.`);
      await loadUsers(pagination.page);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể cập nhật quyền người dùng.'));
    } finally {
      setSaving(false);
    }
  }, [isSelectedSelf, loadUsers, pagination.page, roleToEdit, selectedUser]);

  const deleteSelectedUser = useCallback(async () => {
    if (!selectedUser || isSelectedSelf) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await adminUserRepository.remove(selectedUser.accountId);
      setSelectedAccountId(null);
      setNotice('Đã xóa tài khoản người dùng.');
      await loadUsers(pagination.page);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể xóa tài khoản người dùng.'));
    } finally {
      setSaving(false);
    }
  }, [isSelectedSelf, loadUsers, pagination.page, selectedUser]);

  return {
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
  };
}

export default useUserManagerService;
