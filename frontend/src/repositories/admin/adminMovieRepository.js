import api from '../../utils/api';

export const adminMovieRepository = {
  async getAll(q = '') {
    const params = q.trim() ? { q: q.trim() } : {};
    const { data } = await api.get('/api/movies', { params });
    return data.data;
  },

  async getById(id) {
    const { data } = await api.get(`/api/movies/${id}`);
    return data.data.movie;
  },

  async create(movie) {
    const { data } = await api.post('/api/movies', movie);
    return data.data.movie;
  },

  async update(id, changes) {
    const { data } = await api.patch(`/api/movies/${id}`, changes);
    return data.data.movie;
  },

  async remove(id) {
    await api.delete(`/api/movies/${id}`);
  },
};

export default adminMovieRepository;
