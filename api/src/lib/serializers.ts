import type {
  Booking,
  EquipmentItem,
  GameRegistration,
  GameWaitlistEntry,
  OpenGame,
  Sport,
  SportCenter,
} from "../generated/prisma/client.js";

type SportWithCenterLinks = Sport & {
  centerLinks: { centerId: string }[];
};

type CenterWithRelations = SportCenter & {
  sports: { sportId: string }[];
  courts: {
    id: string;
    name: string;
    sportId: string;
  }[];
};

type OpenGameWithRelations = OpenGame & {
  registrations: GameRegistration[];
  waitlist: GameWaitlistEntry[];
};

export const serializeSport = (sport: SportWithCenterLinks) => ({
  id: sport.id,
  key: sport.key,
  icon: sport.icon,
  hourlyPrice: sport.hourlyPrice,
  centerIds: sport.centerLinks.map((link) => link.centerId),
  equipmentOptions: sport.equipmentOptions,
});

export const serializeEquipment = (item: EquipmentItem) => ({
  id: item.id,
  price: item.price,
});

export const serializeCenter = (center: CenterWithRelations) => ({
  id: center.id,
  name: center.name,
  location: center.location,
  description: {
    et: center.descriptionEt,
    en: center.descriptionEn,
  },
  sportIds: center.sports.map((sport) => sport.sportId),
  rating: center.rating,
  image: center.image,
  courts: center.courts,
  openingHours: {
    open: center.openingHour,
    close: center.closingHour,
  },
});

export const serializeBooking = (booking: Booking) => ({
  id: booking.id,
  sportId: booking.sportId,
  centerId: booking.centerId,
  courtId: booking.courtId ?? undefined,
  date: booking.date,
  time: booking.time,
  duration: booking.duration,
  name: booking.name,
  email: booking.email,
  phone: booking.phone,
  participants: booking.participants,
  status: booking.status,
  note: booking.note ?? "",
  equipment: booking.equipment,
  createdAt: booking.createdAt.toISOString(),
});

export const serializeGame = (game: OpenGameWithRelations) => ({
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
  registeredPlayers: game.registrations.map((registration) => ({
    id: registration.id,
    name: registration.name,
    email: registration.email,
    phone: registration.phone,
  })),
  waitingList: game.waitlist.map((entry) => ({
    id: entry.id,
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
  })),
  createdAt: game.createdAt.toISOString(),
});
