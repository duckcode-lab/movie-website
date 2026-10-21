export class Movie {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.title = data.title ?? null;
    this.englishTitle = data.englishTitle ?? null;
    this.genre = data.genre ?? null;
    this.cast = data.cast ?? null;
    this.director = data.director ?? null;
    this.studio = data.studio ?? null;
    this.country = data.country ?? null;
    this.bannerUrl = data.bannerUrl ?? null;
    this.posterUrl = data.posterUrl ?? null;
    this.videoUrl = data.videoUrl ?? data.video_url ?? null;
    this.quality = data.quality ?? null;
    this.rating = data.rating ?? null;
    this.episodes = data.episodes ?? null;
    this.year = data.year ?? null;
    this.description = data.description ?? null;
  }

  static fromApi(data) {
    return new Movie(data);
  }
}

export default Movie;
