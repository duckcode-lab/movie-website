import adminMovieRepository from './adminMovieRepository';

export const genreRepository = {
  async getAll() {
    const { movies = [] } = await adminMovieRepository.getAll();
    const genres = new Set(
      movies
        .map((movie) => movie.genre?.trim())
        .filter(Boolean),
    );

    return [...genres].sort((first, second) => first.localeCompare(second));
  },

  async getMoviesByGenre(genre) {
    const { movies = [] } = await adminMovieRepository.getAll(genre);
    return movies.filter(
      (movie) => movie.genre?.trim().toLocaleLowerCase() === genre.trim().toLocaleLowerCase(),
    );
  },
};

export default genreRepository;
