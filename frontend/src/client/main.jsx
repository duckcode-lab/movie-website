import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Watch from './Watch.jsx';
import Auth from './Auth.jsx';
import Profile from './Profile.jsx';
import Genres from '../admin/Genres.jsx';
import MovieCreate from '../admin/MovieCreate.jsx';
import AdminLayout from '../layout/AdminLayout.jsx';
import AdminPlaceholderPage from '../components/admin/AdminPlaceholderPage.jsx';
import MovieManagementPage from '../pages/admin/MovieManagementPage.jsx';
import UserManagementPage from '../pages/admin/UserManagementPage.jsx';
import '../style/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/movies/new" element={<MovieCreate />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminPlaceholderPage />} />
          <Route path="movies" element={<MovieManagementPage />} />
          <Route path="genres" element={<Genres />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);