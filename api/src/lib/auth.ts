import { prisma } from "@/lib/prisma.js";
import { getAllowedOrigins } from "@/lib/utils.js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins/username";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: getAllowedOrigins(),
  session: {
    expiresIn: 60 * 60,
    updateAge: 60 * 15,
    freshAge: 60 * 15,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 64,
    }),
  ],
});
