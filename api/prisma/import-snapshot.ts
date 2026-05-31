import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "../src/lib/prisma.js";

type Snapshot = {
  sports: Array<Record<string, unknown>>;
  equipmentItems: Array<Record<string, unknown>>;
  sportCenters: Array<Record<string, unknown>>;
  centerSports: Array<Record<string, unknown>>;
  courts: Array<Record<string, unknown>>;
  pricingRules: Array<Record<string, unknown>>;
  bookingOptions: Array<Record<string, unknown>>;
  bookingOptionComponents: Array<Record<string, unknown>>;
  bookings: Array<Record<string, unknown>>;
  openGames: Array<Record<string, unknown>>;
  gameRegistrations: Array<Record<string, unknown>>;
  gameWaitlistEntries: Array<Record<string, unknown>>;
};

const snapshotPath = process.env.SNAPSHOT_PATH ?? process.argv[2];

if (!snapshotPath) {
  throw new Error("SNAPSHOT_PATH or first command argument is required.");
}

if (process.env.ALLOW_SNAPSHOT_IMPORT !== "true") {
  throw new Error(
    "Refusing to import snapshot. Set ALLOW_SNAPSHOT_IMPORT=true to replace catalog and booking data.",
  );
}

const parseDateFields = <T extends Record<string, unknown>>(
  items: T[],
  fields: string[],
) =>
  items.map((item) => {
    const next: Record<string, unknown> = { ...item };

    for (const field of fields) {
      if (typeof next[field] === "string") {
        next[field] = new Date(next[field] as string);
      }
    }

    return next;
  });

const snapshot = JSON.parse(
  await readFile(resolve(snapshotPath), "utf8"),
) as Snapshot;

await prisma.$transaction(async (tx) => {
  await tx.gameWaitlistEntry.deleteMany();
  await tx.gameRegistration.deleteMany();
  await tx.openGame.deleteMany();
  await tx.booking.deleteMany();
  await tx.court.deleteMany();
  await tx.centerSport.deleteMany();
  await tx.bookingOptionComponent.deleteMany();
  await tx.bookingOption.deleteMany();
  await tx.pricingRule.deleteMany();
  await tx.equipmentItem.deleteMany();
  await tx.sportCenter.deleteMany();
  await tx.sport.deleteMany();

  await tx.sport.createMany({ data: snapshot.sports as never });
  await tx.equipmentItem.createMany({ data: snapshot.equipmentItems as never });
  await tx.sportCenter.createMany({ data: snapshot.sportCenters as never });
  await tx.centerSport.createMany({ data: snapshot.centerSports as never });
  await tx.court.createMany({ data: snapshot.courts as never });
  await tx.pricingRule.createMany({ data: snapshot.pricingRules as never });
  await tx.bookingOption.createMany({ data: snapshot.bookingOptions as never });
  await tx.bookingOptionComponent.createMany({ data: snapshot.bookingOptionComponents as never });
  await tx.booking.createMany({
    data: parseDateFields(snapshot.bookings, ["createdAt"]) as never,
  });
  await tx.openGame.createMany({
    data: parseDateFields(snapshot.openGames, ["createdAt"]) as never,
  });
  await tx.gameRegistration.createMany({
    data: parseDateFields(snapshot.gameRegistrations, ["createdAt"]) as never,
  });
  await tx.gameWaitlistEntry.createMany({
    data: parseDateFields(snapshot.gameWaitlistEntries, ["createdAt"]) as never,
  });
});

console.log("Snapshot import completed.");
await prisma.$disconnect();
