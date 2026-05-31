import "dotenv/config";

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma.js";

const snapshot = {
  exportedAt: new Date().toISOString(),
  sports: await prisma.sport.findMany({ orderBy: { id: "asc" } }),
  equipmentItems: await prisma.equipmentItem.findMany({ orderBy: { id: "asc" } }),
  sportCenters: await prisma.sportCenter.findMany({ orderBy: { id: "asc" } }),
  centerSports: await prisma.centerSport.findMany({
    orderBy: [{ centerId: "asc" }, { sportId: "asc" }],
  }),
  courts: await prisma.court.findMany({ orderBy: { id: "asc" } }),
  pricingRules: await prisma.pricingRule.findMany({ orderBy: { id: "asc" } }),
  bookingOptions: await prisma.bookingOption.findMany({ orderBy: { id: "asc" } }),
  bookingOptionComponents: await prisma.bookingOptionComponent.findMany({
    orderBy: [{ optionId: "asc" }, { position: "asc" }],
  }),
  bookings: await prisma.booking.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }),
  openGames: await prisma.openGame.findMany({ orderBy: [{ date: "asc" }, { time: "asc" }] }),
  gameRegistrations: await prisma.gameRegistration.findMany({ orderBy: { createdAt: "asc" } }),
  gameWaitlistEntries: await prisma.gameWaitlistEntry.findMany({ orderBy: { createdAt: "asc" } }),
};

const snapshotsDir = join(process.cwd(), "prisma", "snapshots");
const fileName = `snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
const filePath = join(snapshotsDir, fileName);

await mkdir(snapshotsDir, { recursive: true });
await writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8");

console.log(`Snapshot written to ${filePath}`);
await prisma.$disconnect();
