export class User {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.accountId = data.accountId ?? data.account_id ?? null;
    this.username = data.username ?? null;
    this.email = data.email ?? null;
    this.fullName = data.fullName ?? data.full_name ?? data.fullname ?? null;
    this.avatarUrl = data.avatarUrl ?? data.avatar_url ?? null;
    this.dateOfBirth = data.dateOfBirth ?? data.date_of_birth ?? null;
    this.gender = data.gender ?? null;
    this.bio = data.bio ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
    this.role = data.role ?? null;
  }

  static fromApi(data) {
    return new User(data);
  }
}

export default User;
