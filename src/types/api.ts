export interface Sport {
  id: string;
  key: string;
  centerIds: string[];
  equipmentOptions: string[];
  hourlyPrice: number;
  priceMin: number;
  priceMax: number;
  durationMinutes: number;
  componentSportIds?: string[];
  category?: string;
  participantMax?: number;
  note?: string;
}

export interface Court {
  id: string;
  name: string;
  sportId: string;
}

export interface SportCenter {
  id: string;
  name: string;
  location: string;
  description: { et: string; en: string };
  sportIds: string[];
  bookingOptionIds: string[];
  image: string;
  courts: Court[];
  openingHours: { open: number; close: number };
}

export interface PricingRule {
  id: string;
  serviceId: string;
  price: number;
  priority: number;
  months: number[];
  weekdays: number[];
  startMinute?: number;
  endMinute?: number;
  organizationType?: string;
}

export interface Booking {
  id: string;
  sportId: string;
  bookingGroupId?: string;
  bookingOptionId?: string;
  bookingOptionName?: string;
  centerId: string;
  date: string;
  time: string;
  duration: number;
  name?: string;
  email?: string;
  phone?: string;
  participants: number;
  status: "confirmed" | "cancelled";
  courtId?: string;
  note?: string;
  equipment: string[];
  createdAt: string;
}

export interface AdminBooking extends Booking {
  name: string;
  email: string;
  phone: string;
  sportName: string;
  resourceName?: string;
  centerName: string;
  courtName: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: "admin" | "senior_admin";
}

export type SkillLevel = "beginner" | "intermediate" | "professional";

export interface GameParticipant {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface OpenGame {
  id: string;
  sportId: string;
  centerId: string;
  courtId: string;
  date: string;
  time: string;
  duration: number;
  description: string;
  level: SkillLevel;
  minPlayers: number;
  maxPlayers: number;
  creatorName: string;
  equipment: string[];
  registeredPlayers: GameParticipant[];
  waitingList: GameParticipant[];
  createdAt: string;
}

export interface CatalogResponse {
  sports: Sport[];
  bookingOptions: Sport[];
  sportCenters: SportCenter[];
  pricingRules: PricingRule[];
  equipmentPrices: Record<string, number>;
  sportPrices: Record<string, number>;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  courtId?: string;
}
