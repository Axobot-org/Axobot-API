interface AuthenticatedUserObject {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string;
}

interface OauthUserData {
  id: string;
  avatar: string | null;
  global_name: string | null;
  locale: string;
  public_flags: number;
  username: string;
}
