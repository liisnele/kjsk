export interface Sport {
  id: string;
  key: string;
  icon: string;
  centerIds: string[];
  equipmentOptions: string[];
}

export interface SportCenter {
  id: string;
  name: string;
  location: string;
  description: { et: string; en: string };
  sportIds: string[];
  rating: number;
  image: string;
  courts: { id: string; name: string; sportId: string }[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  courtId?: string;
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
}

export const sports: Sport[] = [
  { id: "running", key: "running", icon: "🏃", centerIds: ["ahtme"], equipmentOptions: [] },
  { id: "aerobics", key: "aerobics", icon: "🤸", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["Joogamatt / Yoga mat"] },
  { id: "badminton", key: "badminton", icon: "🏸", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["Reketid / Rackets", "Sulid / Shuttlecocks"] },
  { id: "gym", key: "gym", icon: "🏋️", centerIds: ["wiru", "spordihoone"], equipmentOptions: [] },
  { id: "swimming", key: "swimming", icon: "🏊", centerIds: ["wiru"], equipmentOptions: ["Ujumislaud / Kickboard", "Ujumisprillid / Goggles"] },
  { id: "tennis", key: "tennis", icon: "🎾", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["Reketid / Rackets", "Pallid / Balls"] },
  { id: "basketball", key: "basketball", icon: "🏀", centerIds: ["wiru", "ahtme", "spordihoone"], equipmentOptions: ["Pall / Ball"] },
  { id: "volleyball", key: "volleyball", icon: "🏐", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["Pall / Ball", "Võrk / Net"] },
  { id: "skating", key: "skating", icon: "⛸️", centerIds: ["jaahall"], equipmentOptions: ["Uisud / Skates", "Kiiver / Helmet"] },
  { id: "hockey", key: "hockey", icon: "🏒", centerIds: ["jaahall"], equipmentOptions: ["Kepp / Stick", "Kiiver / Helmet", "Kaitsmed / Pads"] },
];

export const sportCenters: SportCenter[] = [
  {
    id: "wiru",
    name: "Wiru spordikeskus",
    location: "Järveküla tee 2, Kohtla-Järve",
    description: {
      et: "Moodne spordikeskus basseiniga, jõusaali ja pallimängusaalidega.",
      en: "Modern sports center with pool, gym and ball game halls.",
    },
    sportIds: ["aerobics", "badminton", "gym", "swimming", "tennis", "basketball", "volleyball"],
    rating: 4.6,
    image: "",
    courts: [
      { id: "w1", name: "Saal 1", sportId: "basketball" },
      { id: "w2", name: "Saal 2", sportId: "volleyball" },
      { id: "w3", name: "Tennis 1", sportId: "tennis" },
      { id: "w4", name: "Tennis 2", sportId: "tennis" },
      { id: "w5", name: "Sulgpall 1", sportId: "badminton" },
      { id: "w6", name: "Bassein", sportId: "swimming" },
      { id: "w7", name: "Jõusaal", sportId: "gym" },
      { id: "w8", name: "Aeroobika saal", sportId: "aerobics" },
    ],
  },
  {
    id: "jaahall",
    name: "Jäähall",
    location: "Endla 4, Kohtla-Järve",
    description: {
      et: "Jäähall uisutamiseks ja jäähoki mängimiseks.",
      en: "Ice hall for skating and ice hockey.",
    },
    sportIds: ["skating", "hockey"],
    rating: 4.3,
    image: "",
    courts: [
      { id: "j1", name: "Jääväljak 1", sportId: "skating" },
      { id: "j2", name: "Jääväljak 2", sportId: "hockey" },
    ],
  },
  {
    id: "ahtme",
    name: "Ahtme kergejõustikuhall",
    location: "Spordi 2, Kohtla-Järve",
    description: {
      et: "Kergejõustikuhall jooksutreeninguteks ja pallimängudeks.",
      en: "Athletics hall for track running and ball sports.",
    },
    sportIds: ["running", "basketball"],
    rating: 4.1,
    image: "",
    courts: [
      { id: "a1", name: "Jooksurada", sportId: "running" },
      { id: "a2", name: "Pallisaal", sportId: "basketball" },
    ],
  },
  {
    id: "spordihoone",
    name: "Kohtla-Järve spordihoone",
    location: "Spordi 6, Kohtla-Järve",
    description: {
      et: "Mitmekülgne spordihoone erinevate spordialade harrastamiseks.",
      en: "Versatile sports building for various sports activities.",
    },
    sportIds: ["aerobics", "badminton", "gym", "tennis", "basketball", "volleyball"],
    rating: 4.0,
    image: "",
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

export const sportPrices: Record<string, number> = {
  running: 5,
  aerobics: 8,
  badminton: 12,
  gym: 6,
  swimming: 7,
  tennis: 15,
  basketball: 20,
  volleyball: 18,
  skating: 6,
  hockey: 25,
};

export function generateTimeSlots(date: string, centerId: string, sportId: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const center = sportCenters.find((c) => c.id === centerId);
  if (!center) return slots;
  const relevantCourts = center.courts.filter((c) => c.sportId === sportId);
  const seed = date.split("-").reduce((a, b) => a + parseInt(b), 0) + centerId.length + sportId.length;

  for (let hour = 8; hour <= 21; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    for (const court of relevantCourts) {
      const hash = (seed * (hour + 1) * (court.id.charCodeAt(1) + 1)) % 10;
      slots.push({ time, available: hash > 3, courtId: court.id });
    }
  }
  return slots;
}

export const initialBookings: Booking[] = [
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
    status: "confirmed",
    courtId: "w3",
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
    status: "confirmed",
    courtId: "w6",
  },
];
