import api from '../../utils/api';

export const adminUserRepository = {
  async getAll({ page = 1, limit = 20, q, role } = {}) {
    const params = { page, limit };
    if (q?.trim()) params.q = q.trim();
    if (role) params.role = role;

    const { data } = await api.get('/api/admin/users', { params });
    return data.data;
  },

  async getById(accountId) {
    const { data } = await api.get(`/api/admin/users/${accountId}`);
    return data.data;
  },

  async updateRole(accountId, role) {
    const { data } = await api.patch(
      `/api/admin/users/${accountId}/role`,
      { role },
    );
    return data.data;
  },

  async remove(accountId) {
    await api.delete(`/api/admin/users/${accountId}`);
  },
};

export default adminUserRepository;
