export class Comment {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.movieId = data.movieId ?? data.movie_id ?? null;
    this.content = data.content ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.username = data.username ?? null;
    this.fullName = data.fullName ?? data.full_name ?? null;
    this.isHidden = data.isHidden ?? data.is_hidden ?? null;
  }

  static fromApi(data) {
    return new Comment(data);
  }
}

export default Comment;
