import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Watch from './Watch.jsx';
import Auth from './Auth.jsx';
<<<<<<< Updated upstream:frontend/src/client/main.jsx
import Profile from './Profile.jsx';
import Genres from '../admin/Genres.jsx';
import MovieCreate from '../admin/MovieCreate.jsx';
import '../style/index.css';
=======
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminPlaceholderPage from './components/admin/AdminPlaceholderPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import './index.css';
>>>>>>> Stashed changes:frontend/src/main.jsx

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/genres" element={<Genres />} />
        <Route path="/admin/movies/new" element={<MovieCreate />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminPlaceholderPage />} />
          <Route path="movies" element={<AdminPlaceholderPage />} />
          <Route path="genres" element={<AdminPlaceholderPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);