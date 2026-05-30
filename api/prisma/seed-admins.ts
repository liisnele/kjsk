import "dotenv/config";

import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

const getAdminUsersFromEnv = () => {
  if (!process.env.ADMIN_USERS_JSON) {
    throw new Error("ADMIN_USERS_JSON is required to seed admin users.");
  }

  const parsed = JSON.parse(process.env.ADMIN_USERS_JSON) as Array<{
    username?: string;
    email?: string;
    password?: string;
    role?: "admin" | "senior_admin";
  }>;

  return parsed.map((user) => {
    if (!user.username || !user.password) {
      throw new Error("ADMIN_USERS_JSON entries must include username and password.");
    }

    if (user.password.length < 12) {
      throw new Error("Admin passwords must be at least 12 characters long.");
    }

    return {
      username: user.username.toLowerCase(),
      email: (user.email ?? `${user.username}@admin.local`).toLowerCase(),
      password: user.password,
      role: user.role ?? "admin",
    };
  });
};

async function main() {
  const adminUsers = getAdminUsersFromEnv();

  for (const adminUser of adminUsers) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ username: adminUser.username }, { email: adminUser.email }],
      },
    });

    if (!user) {
      await auth.api.signUpEmail({
        body: {
          email: adminUser.email,
          password: adminUser.password,
          name: adminUser.username,
          username: adminUser.username,
        },
      });

      user = await prisma.user.findUniqueOrThrow({
        where: {
          email: adminUser.email,
        },
      });
    } else {
      const passwordHash = await hashPassword(adminUser.password);
      const credentialAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          providerId: "credential",
        },
      });

      if (credentialAccount) {
        await prisma.account.update({
          where: {
            id: credentialAccount.id,
          },
          data: {
            password: passwordHash,
          },
        });
      } else {
        await prisma.account.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            providerId: "credential",
            accountId: user.id,
            password: passwordHash,
          },
        });
      }
    }

    await prisma.user.update({
      where: {
        email: adminUser.email,
      },
      data: {
        username: adminUser.username,
        displayUsername: adminUser.username,
        role: adminUser.role,
        active: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
