import axios from 'axios';
const API_BASE_URL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Hỗ trợ CORS credentials
});

// Tự động đính kèm Bearer token nếu có trong localStorage
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- AUTH API ---
export const sendOtp = (data) => api.post('/auth/send_otp', data);
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const loginGoogle = (data) => api.post('/auth/google/login', data);
export const getProfile = () => api.get('/auth/profile');
export const createProfile = (data) => api.post('/auth/profile', data);
export const updateProfile = (data) => api.patch('/auth/profile', data);
export const deleteProfile = () => api.delete('/auth/profile');
export const resetPassword = (data) => api.put('/auth/reset_password', data);

// --- MOVIE API ---
export const getMovies = (query = '') => api.get('/movies', {
  params: query ? { q: query } : undefined,
});
export const getMovieDetail = (id) => api.get(`/movies/${id}`);
export const createMovie = (data) => api.post('/movies', data);
export const updateMovie = (id, data) => api.patch(`/movies/${id}`, data);
export const deleteMovie = (id) => api.delete(`/movies/${id}`);

// --- GENRE API ---
export const getGenres = () => api.get('/genres');
export const createGenre = (data) => api.post('/genres', data);
export const updateGenre = (id, data) => api.patch(`/genres/${id}`, data);
export const deleteGenre = (id) => api.delete(`/genres/${id}`);

// --- COMMENT API ---
export const getComments = (movieId) => api.get(`/comments?movieId=${movieId}`);
export const createComment = (movieId, content) => api.post(`/comments/${movieId}/comments`, { content });
export const toggleCommentHidden = (movieId, commentId, isHidden) => api.patch(`/comments/${movieId}/comments/${commentId}`, { isHidden });
export const deleteComment = (movieId, commentId) => api.delete(`/comments/${movieId}/comments/${commentId}`);

export default api;