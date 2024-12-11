import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user?: {
      id?: string;
      token?: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    accessToken?: string;
    error?: string;
  }
}
