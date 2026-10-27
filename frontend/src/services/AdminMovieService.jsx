import { useCallback, useEffect, useState } from 'react';
import { getGenres } from '../api/api';
import adminMovieRepository from '../repositories/admin/adminMovieRepository';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

async function fetchMovieData() {
  const [movieResult, genreResponse] = await Promise.all([
    adminMovieRepository.getAll(),
    getGenres(),
  ]);
  const movieList = movieResult?.movies;
  const genreList = genreResponse.data?.data?.genres;

  if (!Array.isArray(movieList) || !Array.isArray(genreList)) {
    throw new Error('Dữ liệu phim hoặc thể loại không hợp lệ.');
  }

  return { movieList, genreList };
}

export function useAdminMovieService() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { movieList, genreList } = await fetchMovieData();
      setMovies(movieList);
      setGenres(genreList);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tải dữ liệu phim.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    fetchMovieData()
      .then(({ movieList, genreList }) => {
        if (isActive) {
          setMovies(movieList);
          setGenres(genreList);
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(getErrorMessage(requestError, 'Không thể tải dữ liệu phim.'));
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const createMovie = useCallback(async (movie) => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const createdMovie = await adminMovieRepository.create(movie);
      setMovies((current) => [createdMovie, ...current]);
      setNotice(`Đã thêm phim "${createdMovie.title}".`);
      return createdMovie;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể thêm phim.'));
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateMovie = useCallback(async (id, changes) => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedMovie = await adminMovieRepository.update(id, changes);
      setMovies((current) => current.map((movie) => (
        movie.id === updatedMovie.id ? updatedMovie : movie
      )));
      setNotice(`Đã cập nhật phim "${updatedMovie.title}".`);
      return updatedMovie;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể cập nhật phim.'));
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteMovie = useCallback(async (movie) => {
    setSaving(true);
    setError('');
    setNotice('');

    try {
      await adminMovieRepository.remove(movie.id);
      setMovies((current) => current.filter((item) => item.id !== movie.id));
      setNotice(`Đã xóa phim "${movie.title}".`);
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể xóa phim.'));
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    movies,
    genres,
    loading,
    saving,
    error,
    notice,
    loadData,
    createMovie,
    updateMovie,
    deleteMovie,
  };
}

export default useAdminMovieService;
