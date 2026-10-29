import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import App from './App.jsx';
import Watch from './Watch.jsx';
import Auth from './Auth.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import Profile from './Profile.jsx';
import Genres from '../admin/Genres.jsx';
import MovieCreate from '../admin/MovieCreate.jsx';
import AdminLayout from '../layout/AdminLayout.jsx';
import AdminPlaceholderPage from '../components/admin/AdminPlaceholderPage.jsx';
import MovieManagementPage from '../pages/admin/MovieManagementPage.jsx';
import UserManagementPage from '../pages/admin/UserManagementPage.jsx';
import api from '../api/api.js';
import repositoryApi from '../utils/api.js';
import AuthBootstrap from './AuthBootstrap.jsx';
import GlobalLoadingIndicator from '../layout/GlobalLoadingIndicator.jsx';
import { trackAxiosClient } from '../api/apiLoading.js';
import '../style/index.css';

trackAxiosClient(axios);
trackAxiosClient(api);
trackAxiosClient(repositoryApi);

localStorage.removeItem('refreshToken');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalLoadingIndicator />
      <AuthBootstrap>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/movies/new" element={<MovieCreate />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminPlaceholderPage />} />
            <Route path="movies" element={<MovieManagementPage />} />
            <Route path="genres" element={<Genres />} />
            <Route path="users" element={<UserManagementPage />} />
          </Route>
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  </React.StrictMode>
);