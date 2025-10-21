import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      githubId?: string;
      username?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }

  interface Profile {
    id?: string | number;
    login?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
    githubId?: string;
  }
}
