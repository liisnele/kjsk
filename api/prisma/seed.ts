import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const ahtmeServices = [
  { id: "ahtme-single-ticket", key: "Kergejoustik + jousaal", icon: "T", hourlyPrice: 6, priceMin: 4, priceMax: 6 },
  { id: "ahtme-club-training-full", key: "Registreeritud treening: kergejoustikuareen 1/1", icon: "A", hourlyPrice: 30, priceMin: 22, priceMax: 30 },
  { id: "ahtme-club-training-half", key: "Registreeritud treening: kergejoustikuareen 1/2", icon: "A", hourlyPrice: 17, priceMin: 14, priceMax: 17 },
  { id: "ahtme-club-training-quarter", key: "Registreeritud treening: kergejoustikuareen 1/4", icon: "A", hourlyPrice: 10, priceMin: 8, priceMax: 10 },
  { id: "ahtme-club-training-aerobics", key: "Registreeritud treening: aeroobikasaal", icon: "A", hourlyPrice: 14, priceMin: 10, priceMax: 14 },
  { id: "ahtme-club-training-gym", key: "Registreeritud treening: jousaal", icon: "J", hourlyPrice: 12, priceMin: 9, priceMax: 12 },
  { id: "ahtme-unregistered-event-hall", key: "Registreerimata uritus/voistlus: kergejoustikuhall", icon: "H", hourlyPrice: 80 },
  { id: "ahtme-unregistered-event-territory", key: "Registreerimata uritus/voistlus: hall ja territoorium", icon: "H", hourlyPrice: 90 },
  { id: "ahtme-registered-training-full", key: "Registreeritud treening: kergejoustikuareen 1/1", icon: "R", hourlyPrice: 28, priceMin: 20, priceMax: 28 },
  { id: "ahtme-registered-training-half", key: "Registreeritud treening: kergejoustikuareen 1/2", icon: "R", hourlyPrice: 15, priceMin: 12, priceMax: 15 },
  { id: "ahtme-registered-training-quarter", key: "Registreeritud treening: kergejoustikuareen 1/4", icon: "R", hourlyPrice: 8, priceMin: 6, priceMax: 8 },
  { id: "ahtme-registered-training-aerobics", key: "Registreeritud treening: aeroobikasaal", icon: "R", hourlyPrice: 12, priceMin: 9, priceMax: 12 },
  { id: "ahtme-registered-training-gym", key: "Registreeritud treening: jousaal", icon: "J", hourlyPrice: 10, priceMin: 7, priceMax: 10 },
  { id: "ahtme-registered-event-hall", key: "Registreeritud uritus/voistlus: kergejoustikuhall", icon: "H", hourlyPrice: 60 },
  { id: "ahtme-registered-event-territory", key: "Registreeritud uritus/voistlus: hall ja territoorium", icon: "H", hourlyPrice: 80 },
  { id: "ahtme-school-pe-free", key: "Koolide liikumisope, treeningud ja uritused", icon: "K", hourlyPrice: 0 },
  { id: "ahtme-tennis-court", key: "Tennis", icon: "T", hourlyPrice: 10, priceMin: 5, priceMax: 10 },
  { id: "ahtme-volleyball-court", key: "Vorkpall", icon: "V", hourlyPrice: 10, priceMin: 5, priceMax: 10 },
  { id: "ahtme-badminton-court", key: "Sulgpall", icon: "S", hourlyPrice: 10, priceMin: 5, priceMax: 10 },
  { id: "ahtme-supported-club-training", key: "Toetatavate spordiklubide ja Johvi Spordikooli treeningud", icon: "R", hourlyPrice: 10 },
  { id: "ahtme-supported-prep-time", key: "Toetatavate spordiklubide voistluste ettevalmistamise aeg", icon: "P", hourlyPrice: 2 },
  { id: "ahtme-unregistered-prep-time", key: "Registreerimata voistluste ja urituste ettevalmistamise aeg", icon: "P", hourlyPrice: 0 },
  { id: "ahtme-state-school-pe", key: "HTM hallatavate koolide kehaline kasvatus ja uritused", icon: "K", hourlyPrice: 15, priceMin: 10, priceMax: 15 },
  { id: "ahtme-city-event-free", key: "Kohtla-Jarve Linnavalitsuse korraldatav voistlus/uritus", icon: "L", hourlyPrice: 0 },
  { id: "ahtme-table-tennis", key: "Lauatennis", icon: "L", hourlyPrice: 4, priceMin: 2, priceMax: 4 },
  { id: "ahtme-private-running-track", key: "Jooksurada", icon: "J", hourlyPrice: 10, priceMin: 6, priceMax: 10 },
  { id: "ahtme-package-arena-gym-tennis-sauna", key: "Pakett: areen, jalgpall, jousaal, tennis ja saun", icon: "P", hourlyPrice: 25 },
  { id: "ahtme-package-volleyball-sauna", key: "Pakett: vorkpallivaljak ja saun", icon: "P", hourlyPrice: 20 },
  { id: "ahtme-package-gym-tabletennis-sauna", key: "Pakett: jousaal, lauatennis ja saun", icon: "P", hourlyPrice: 20 },
  { id: "ahtme-family-package", key: "Perepakett 2 taiskasvanut + kuni 3 last", icon: "P", hourlyPrice: 12 },
  { id: "ahtme-sauna-small", key: "Saun", icon: "S", hourlyPrice: 10 },
  { id: "ahtme-sauna-gym", key: "Saun+jousaal", icon: "S", hourlyPrice: 15 },
];

const getAhtmeServiceDurationMinutes = (serviceId: string) => {
  if (serviceId.includes("single-")) return 120;
  if (serviceId.includes("package")) return 120;
  if (
    serviceId.includes("carpet") ||
    serviceId.includes("high-jump-mat") ||
    serviceId.includes("tables-chairs")
  ) {
    return 24 * 60;
  }

  return 60;
};

const sports = [
  ...ahtmeServices.map((service) => ({
    ...service,
    priceMin: service.priceMin ?? service.hourlyPrice,
    priceMax: service.priceMax ?? service.hourlyPrice,
    durationMinutes: getAhtmeServiceDurationMinutes(service.id),
    centerIds: ["ahtme"],
    equipmentOptions: [],
  })),
  { id: "running", key: "running", icon: "🏃", centerIds: ["ahtme"], equipmentOptions: [], hourlyPrice: 5 },
  { id: "aerobics", key: "aerobics", icon: "🤸", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["yogaMat", "music"], hourlyPrice: 8 },
  { id: "badminton", key: "badminton", icon: "🏸", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["rackets", "shuttlecocks"], hourlyPrice: 12 },
  { id: "gym", key: "gym", icon: "🏋️", centerIds: ["wiru", "spordihoone"], equipmentOptions: [], hourlyPrice: 6 },
  { id: "swimming", key: "swimming", icon: "🏊", centerIds: ["wiru"], equipmentOptions: ["kickboard", "goggles"], hourlyPrice: 7 },
  { id: "tennis", key: "tennis", icon: "🎾", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["rackets", "balls"], hourlyPrice: 15 },
  { id: "basketball", key: "basketball", icon: "🏀", centerIds: ["wiru", "ahtme", "spordihoone"], equipmentOptions: ["ball"], hourlyPrice: 20 },
  { id: "volleyball", key: "volleyball", icon: "🏐", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["ball", "net"], hourlyPrice: 18 },
  { id: "skating", key: "skating", icon: "⛸️", centerIds: ["jaahall"], equipmentOptions: ["skates", "helmet"], hourlyPrice: 6 },
  { id: "hockey", key: "hockey", icon: "🏒", centerIds: ["jaahall"], equipmentOptions: ["stick", "helmet", "pads"], hourlyPrice: 25 },
];

const equipmentPrices = {
  yogaMat: 2,
  rackets: 5,
  shuttlecocks: 1,
  kickboard: 3,
  goggles: 2,
  balls: 3,
  ball: 2,
  net: 5,
  skates: 10,
  helmet: 5,
  stick: 3,
  pads: 10,
  music: 0,
};

const centers = [
  {
    id: "wiru",
    name: "Wiru spordikeskus",
    location: "Järveküla tee 2, Kohtla-Järve",
    descriptionEt:
      "Wiru spordikeskus on kaasaegne ja mitmekesine treeningkeskkond, mis pakub võimalusi erineva tasemega harrastajatele alates algajatest kuni edasijõudnuteni.",
    descriptionEn:
      "Wiru spordikeskus is a modern and diverse training environment that offers opportunities for enthusiasts of different levels from beginners to advanced.",
    rating: 4.6,
    image: "",
    openingHour: 8,
    closingHour: 22,
    sportIds: ["aerobics", "badminton", "gym", "swimming", "tennis", "basketball", "volleyball"],
    courts: [
      { id: "w1", name: "Korvpallisaal 1", sportId: "basketball" },
      { id: "w2", name: "Korvpallisaal 2", sportId: "basketball" },
      { id: "w3", name: "Korvpallisaal 3", sportId: "basketball" },
      { id: "w4", name: "Võrkpallisaal 1", sportId: "volleyball" },
      { id: "w5", name: "Võrkpallisaal 2", sportId: "volleyball" },
      { id: "w6", name: "Võrkpallisaal 3", sportId: "volleyball" },
      { id: "w7", name: "Tennis 1", sportId: "tennis" },
      { id: "w8", name: "Tennis 2", sportId: "tennis" },
      { id: "w9", name: "Sulgpall 1", sportId: "badminton" },
      { id: "w10", name: "Sulgpall 2", sportId: "badminton" },
      { id: "w11", name: "Bassein (1)", sportId: "swimming" },
      { id: "w12", name: "Bassein (2)", sportId: "swimming" },
      { id: "w13", name: "Jõusaal", sportId: "gym" },
      { id: "w14", name: "Aeroobika saal (suur)", sportId: "aerobics" },
      { id: "w15", name: "Aeroobika saal (väike)", sportId: "aerobics" },
      { id: "w16", name: "Jooksurada (50m)", sportId: "running" },
    ],
  },
  {
    id: "jaahall",
    name: "Jäähall",
    location: "Spordi 4, Kohtla-Järve",
    descriptionEt:
      "Jäähall on dünaamiline spordikeskkond, kus toimuvad nii jääspordialade treeningud kui ka avalik uisutamine.",
    descriptionEn:
      "The ice hall is a dynamic sports environment where both ice sports training and public skating take place.",
    rating: 4.3,
    image: "",
    openingHour: 8,
    closingHour: 22,
    sportIds: ["skating", "hockey"],
    courts: [
      { id: "j1", name: "Jääväljak 1", sportId: "skating" },
      { id: "j2", name: "Jääväljak 2", sportId: "hockey" },
    ],
  },
  {
    id: "ahtme",
    name: "Ahtme kergejõustikuhall",
    location: "Ahtme mnt. 61, Kohtla-Järve",
    descriptionEt:
      "Kergejõustikuhall pakub professionaalset ja aastaringset treeningkeskkonda erinevate kergejõustikualade harrastamiseks.",
    descriptionEn:
      "Athletics hall offers a professional and year-round training environment for various athletics disciplines.",
    rating: 4.1,
    image: "",
    openingHour: 7,
    closingHour: 21,
    sportIds: ahtmeServices.map((service) => service.id),
    courts: ahtmeServices.map((service, index) => ({
      id: `ahtme-service-${index + 1}`,
      name: service.key,
      sportId: service.id,
    })),
  },
  {
    id: "spordihoone",
    name: "Spordihoone",
    location: "Järveküla tee 44, Kohtla-Järve",
    descriptionEt:
      "Spordihoone on spordikeskuse vanim hoone, mis kannab endas tugevaid sporditraditsioone ning pakub mitmekesiseid võimalusi liikumiseks.",
    descriptionEn:
      "The sports building is the oldest facility in the sports center, carrying strong sports traditions and offering diverse opportunities for physical activity.",
    rating: 4,
    image: "",
    openingHour: 8,
    closingHour: 21,
    sportIds: ["aerobics", "badminton", "gym", "tennis", "basketball", "volleyball"],
    courts: [
      { id: "s1", name: "Suur saal", sportId: "basketball" },
      { id: "s2", name: "Väike saal", sportId: "volleyball" },
      { id: "s3", name: "Tennis", sportId: "tennis" },
      { id: "s4", name: "Sulgpall", sportId: "badminton" },
      { id: "s5", name: "Jõusaal", sportId: "gym" },
      { id: "s6", name: "Rühmatreeningud", sportId: "aerobics" },
    ],
  },
];

const bookings = [
  {
    id: "b1",
    sportId: "tennis",
    centerId: "wiru",
    date: "2026-03-23",
    time: "10:00",
    duration: 1,
    name: "Andrei Ivanov",
    email: "andrei@mail.ee",
    phone: "+372 5551234",
    participants: 2,
    status: "confirmed" as const,
    courtId: "w3",
    equipment: [],
    note: "",
  },
  {
    id: "b2",
    sportId: "swimming",
    centerId: "wiru",
    date: "2026-03-24",
    time: "14:00",
    duration: 2,
    name: "Maria Petrova",
    email: "maria@mail.ee",
    phone: "+372 5559876",
    participants: 1,
    status: "confirmed" as const,
    courtId: "w6",
    equipment: [],
    note: "",
  },
];

const games = [
  {
    id: "g1",
    sportId: "basketball",
    centerId: "wiru",
    courtId: "w1",
    date: "2026-03-23",
    time: "18:00",
    duration: 2,
    description: "Sõbralik korvpallimäng kõigile! Tulge mängime ja naudime head aega.",
    level: "intermediate" as const,
    minPlayers: 6,
    maxPlayers: 10,
    registeredPlayers: ["Andrei I.", "Viktor K.", "Elena S.", "Dmitri P."],
    creatorName: "Andrei I.",
    equipment: [],
  },
  {
    id: "g5",
    sportId: "volleyball",
    centerId: "spordihoone",
    courtId: "s2",
    date: "2026-03-24",
    time: "19:00",
    duration: 2,
    description: "Võrkpall algajatele, õpime koos! Kõik on oodatud.",
    level: "beginner" as const,
    minPlayers: 8,
    maxPlayers: 12,
    registeredPlayers: ["Maria P.", "Jelena T.", "Anna K."],
    creatorName: "Maria P.",
    equipment: ["ball"],
  },
  {
    id: "g3",
    sportId: "badminton",
    centerId: "wiru",
    courtId: "w5",
    date: "2026-03-25",
    time: "17:00",
    duration: 1,
    description: "Badminton session for intermediate players with room for a few more people.",
    level: "intermediate" as const,
    minPlayers: 2,
    maxPlayers: 4,
    registeredPlayers: ["Igor R."],
    creatorName: "Igor R.",
    equipment: ["rackets", "shuttlecocks"],
  },
  {
    id: "g4",
    sportId: "hockey",
    centerId: "jaahall",
    courtId: "j2",
    date: "2026-03-26",
    time: "20:00",
    duration: 2,
    description: "Jäähoki trenn kogenud mängijatele. Täisvarustus nõutud.",
    level: "professional" as const,
    minPlayers: 10,
    maxPlayers: 20,
    registeredPlayers: ["Aleksei M.", "Pavel S.", "Roman K.", "Nikita V.", "Sergei L.", "Oleg T.", "Artem D."],
    creatorName: "Aleksei M.",
    equipment: ["stick", "helmet", "pads"],
  },
  {
    id: "g2",
    sportId: "tennis",
    centerId: "spordihoone",
    courtId: "s3",
    date: "2026-03-27",
    time: "10:00",
    duration: 1,
    description: "Tennise üksikmäng hommikul. Tule ja tee trenni!",
    level: "beginner" as const,
    minPlayers: 2,
    maxPlayers: 2,
    registeredPlayers: ["Katrin L."],
    creatorName: "Katrin L.",
    equipment: ["rackets", "balls"],
  },
  {
    id: "g6",
    sportId: "volleyball",
    centerId: "spordihoone",
    courtId: "s4",
    date: "2026-03-28",
    time: "19:30",
    duration: 2,
    description: "Open volleyball match for intermediate players.",
    level: "intermediate" as const,
    minPlayers: 8,
    maxPlayers: 8,
    registeredPlayers: ["Kristjan K.", "Taavi R.", "Kristo S.", "Jaan T.", "Rait V.", "Martin L.", "Toomas P.", "Erik M."],
    creatorName: "Kristjan K.",
    equipment: ["ball"],
  },
];

async function main() {
  await prisma.gameWaitlistEntry.deleteMany();
  await prisma.gameRegistration.deleteMany();
  await prisma.openGame.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.court.deleteMany();
  await prisma.centerSport.deleteMany();
  await prisma.equipmentItem.deleteMany();
  await prisma.sportCenter.deleteMany();
  await prisma.sport.deleteMany();

  for (const sport of sports) {
    const priceMin = "priceMin" in sport ? sport.priceMin : sport.hourlyPrice;
    const priceMax = "priceMax" in sport ? sport.priceMax : sport.hourlyPrice;
    const durationMinutes =
      "durationMinutes" in sport ? sport.durationMinutes : 60;

    await prisma.sport.create({
      data: {
        id: sport.id,
        key: sport.key,
        icon: sport.icon,
        hourlyPrice: sport.hourlyPrice,
        priceMin,
        priceMax,
        durationMinutes,
        equipmentOptions: sport.equipmentOptions,
      },
    });
  }

  for (const [id, price] of Object.entries(equipmentPrices)) {
    await prisma.equipmentItem.create({
      data: { id, price },
    });
  }

  for (const center of centers) {
    await prisma.sportCenter.create({
      data: {
        id: center.id,
        name: center.name,
        location: center.location,
        descriptionEt: center.descriptionEt,
        descriptionEn: center.descriptionEn,
        rating: center.rating,
        image: center.image,
        openingHour: center.openingHour,
        closingHour: center.closingHour,
        sports: {
          create: center.sportIds.map((sportId) => ({ sportId })),
        },
        courts: {
          create: center.courts,
        },
      },
    });
  }

  for (const booking of bookings) {
    await prisma.booking.create({
      data: booking,
    });
  }

  for (const game of games) {
    await prisma.openGame.create({
      data: {
        id: game.id,
        sportId: game.sportId,
        centerId: game.centerId,
        courtId: game.courtId,
        date: game.date,
        time: game.time,
        duration: game.duration,
        description: game.description,
        level: game.level,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        creatorName: game.creatorName,
        equipment: game.equipment,
        registrations: {
          create: game.registeredPlayers.map((name) => ({
            name,
            email: "",
            phone: "",
          })),
        },
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
