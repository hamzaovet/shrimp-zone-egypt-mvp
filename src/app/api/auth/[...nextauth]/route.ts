import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;
        
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) return null;
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          assignedBranch: user.assignedBranch || ""
        };
      }
    })
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.assignedBranch = user.assignedBranch;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.assignedBranch = token.assignedBranch;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
};

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
