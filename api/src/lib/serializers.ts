import type {
  Booking,
  BookingOption,
  Court,
  EquipmentItem,
  GameRegistration,
  GameWaitlistEntry,
  OpenGame,
  PricingRule,
  Sport,
  SportCenter,
} from "../generated/prisma/client.js";

type SportWithCenterLinks = Sport & {
  centerLinks: { centerId: string }[];
};

type BookingOptionWithComponents = BookingOption & {
  components: { sportId: string; position: number }[];
};

type CenterWithRelations = SportCenter & {
  sports: { sportId: string }[];
  bookingOptions: { id: string }[];
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

type AdminBookingWithRelations = Booking & {
  sport: Sport;
  center: SportCenter;
  court: Court | null;
};

export const serializeSport = (sport: SportWithCenterLinks) => ({
  id: sport.id,
  key: sport.key,
  hourlyPrice: sport.hourlyPrice,
  priceMin: sport.priceMin,
  priceMax: sport.priceMax,
  durationMinutes: sport.durationMinutes,
  category: sport.category,
  participantMax: sport.participantMax,
  note: sport.note ?? "",
  centerIds: sport.centerLinks.map((link) => link.centerId),
  equipmentOptions: sport.equipmentOptions,
});

export const serializeBookingOption = (option: BookingOptionWithComponents) => ({
  id: option.id,
  key: option.key,
  hourlyPrice: option.hourlyPrice,
  priceMin: option.priceMin,
  priceMax: option.priceMax,
  durationMinutes: option.durationMinutes,
  centerIds: [option.centerId],
  equipmentOptions: [],
  componentSportIds: [...option.components]
    .sort((a, b) => a.position - b.position)
    .map((component) => component.sportId),
  category: option.category,
  participantMax: option.participantMax,
  note: option.note ?? "",
});

export const serializeEquipment = (item: EquipmentItem) => ({
  id: item.id,
  price: item.price,
});

export const serializePricingRule = (rule: PricingRule) => ({
  id: rule.id,
  serviceId: rule.serviceId,
  price: rule.price,
  priority: rule.priority,
  months: rule.months,
  weekdays: rule.weekdays,
  startMinute: rule.startMinute ?? undefined,
  endMinute: rule.endMinute ?? undefined,
  organizationType: rule.organizationType ?? undefined,
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
  bookingOptionIds: center.bookingOptions.map((option) => option.id),
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
  bookingGroupId: booking.bookingGroupId ?? undefined,
  bookingOptionId: booking.bookingOptionId ?? undefined,
  bookingOptionName: booking.bookingOptionName ?? undefined,
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

export const serializeAvailabilityBooking = (booking: Booking) => ({
  id: booking.id,
  sportId: booking.sportId,
  bookingGroupId: booking.bookingGroupId ?? undefined,
  bookingOptionId: booking.bookingOptionId ?? undefined,
  bookingOptionName: booking.bookingOptionName ?? undefined,
  centerId: booking.centerId,
  courtId: booking.courtId ?? undefined,
  date: booking.date,
  time: booking.time,
  duration: booking.duration,
  participants: booking.participants,
  status: booking.status,
  equipment: booking.equipment,
  createdAt: booking.createdAt.toISOString(),
});

export const serializeAdminBooking = (booking: AdminBookingWithRelations) => ({
  ...serializeBooking(booking),
  sportName: booking.bookingOptionName ?? booking.sport.key,
  resourceName: booking.sport.key,
  centerName: booking.center.name,
  courtName: booking.court?.name ?? "",
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
