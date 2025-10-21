import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        try {
          // Check if user already exists
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("github_id", profile.id?.toString())
            .maybeSingle();

          if (fetchError) {
            console.error("Error fetching user from Supabase:", fetchError);
            return false;
          }

          if (!existingUser) {
            // Create new user in Supabase
            const { error: insertError } = await supabase.from("users").insert({
              github_id: profile.id?.toString(),
              username: profile.login || profile.name || "unknown",
              email: user.email,
              avatar_url: user.image,
            });

            if (insertError) {
              // If duplicate key error, user was created by another concurrent request - allow sign in
              if (insertError.code === '23505') {
                console.log("User already exists (concurrent creation), allowing sign in");
                return true;
              }
              console.error("Error creating user in Supabase:", insertError);
              return false;
            }
          } else {
            // Update existing user data
            const { error: updateError } = await supabase
              .from("users")
              .update({
                username: profile.login || profile.name || existingUser.username,
                email: user.email,
                avatar_url: user.image,
              })
              .eq("github_id", profile.id?.toString());

            if (updateError) {
              console.error("Error updating user in Supabase:", updateError);
              // Don't block sign in on update errors
            }
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.githubId = profile?.id?.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.githubId) {
        // Fetch user data from Supabase
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("github_id", token.githubId as string)
          .single();

        if (userData) {
          session.user.id = userData.id;
          session.user.githubId = userData.github_id;
          session.user.username = userData.username;
        }
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
