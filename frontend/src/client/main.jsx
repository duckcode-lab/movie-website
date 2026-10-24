import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Watch from './Watch.jsx';
import Auth from './Auth.jsx';
import Genres from '../admin/Genres.jsx';
import MovieCreate from '../admin/MovieCreate.jsx';
import '../style/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/admin/genres" element={<Genres />} />
        <Route path="/admin/movies/new" element={<MovieCreate />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);