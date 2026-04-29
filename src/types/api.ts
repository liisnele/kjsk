export interface Sport {
  id: string;
  key: string;
  icon: string;
  centerIds: string[];
  equipmentOptions: string[];
  hourlyPrice: number;
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
  rating: number;
  image: string;
  courts: Court[];
  openingHours: { open: number; close: number };
}

export interface Booking {
  id: string;
  sportId: string;
  centerId: string;
  date: string;
  time: string;
  duration: number;
  name: string;
  email: string;
  phone: string;
  participants: number;
  status: "confirmed" | "cancelled";
  courtId?: string;
  note?: string;
  equipment: string[];
  createdAt: string;
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
  sportCenters: SportCenter[];
  equipmentPrices: Record<string, number>;
  sportPrices: Record<string, number>;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  courtId?: string;
}
