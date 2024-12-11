import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies, headers } from "next/headers";

async function refreshAccessToken(token: any) {
  console.log("Now refreshing the expired token...");
  try {
    const res = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers(),
      },
      body: JSON.stringify({ refresh: token.refreshToken }),
    });

    if (!res.ok) {
      console.log("Failed to refresh token: ", res.status, res.statusText);
      throw new Error("Failed to refresh token");
    }

    const data = await res.json();

    if (!data.access) {
      console.log("The token could not be refreshed!");
      throw new Error("Failed to refresh token");
    }

    console.log("The token has been refreshed successfully.");
    const decodedAccessToken = JSON.parse(
      Buffer.from(data.access.split(".")[1], "base64").toString()
    );

    return {
      ...token,
      accessToken: data.access,
      refreshToken: data.refresh ?? token.refreshToken,
      accessTokenExpires: decodedAccessToken["exp"] * 1000,
      error: "",
    };
  } catch (error) {
    console.log("Error refreshing access token: ", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const config = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      credentials: {
        // username: { label: "Username" },
        // password: { label: "Password", type: "password" },
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://127.0.0.1:8000/api/token/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            console.log("Login failed: ", res.status, res.statusText);
            throw new Error("Invalid credentials");
          }

          const user = await res.json();

          if (user) {
            const prefix = "authToken-"; // Произвольный префикс
            cookies().set({
              name: `${prefix}refresh-token`,
              value: user.refresh,
              httpOnly: true,
              sameSite: "strict",
              secure: true,
            });

            return {
              id: user.id,
              email: user.email,
              accessToken: user.access,
              refreshToken: user.refresh,
            };
          }

          return null;
        } catch (error) {
          console.error("Authorization error: ", error);
          throw new Error("Authorization failed");
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.email = user.email;

        const decodedAccessToken = JSON.parse(
          Buffer.from(user.accessToken.split(".")[1], "base64").toString()
        );
        token.accessTokenExpires = decodedAccessToken["exp"] * 1000;
        console.log(
          "Token expires at:",
          new Date(token.accessTokenExpires).toLocaleString()
        );
      }

      if (Date.now() < token.accessTokenExpires) {
        console.log("Token is still valid");
        return token;
      } else {
        console.log("Token expired, refreshing...");
        return await refreshAccessToken(token);
      }
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
    // authorized({ request, auth }) {
    //   const { pathname } = request.nextUrl;
    //   if (privateRoutes.includes(pathname)) {
    //     return !!auth;
    //   }
    //   return true;
    // },
  },

  debug: process.env.NODE_ENV === "development",
};

export const {
  signOut,
  auth,
  handlers: { GET, POST },
} = NextAuth(config);
