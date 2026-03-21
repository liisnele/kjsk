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
  openingHours: { open: number; close: number };
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

export type SkillLevel = "beginner" | "intermediate" | "professional";

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
  registeredPlayers: { name: string }[];
  creatorName: string;
  equipment: string[];
}

export const sports: Sport[] = [
  { id: "running", key: "running", icon: "🏃", centerIds: ["ahtme"], equipmentOptions: [] },
  { id: "aerobics", key: "aerobics", icon: "🤸", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["yogaMat"] },
  { id: "badminton", key: "badminton", icon: "🏸", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["rackets", "shuttlecocks"] },
  { id: "gym", key: "gym", icon: "🏋️", centerIds: ["wiru", "spordihoone"], equipmentOptions: [] },
  { id: "swimming", key: "swimming", icon: "🏊", centerIds: ["wiru"], equipmentOptions: ["kickboard", "goggles"] },
  { id: "tennis", key: "tennis", icon: "🎾", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["rackets", "balls"] },
  { id: "basketball", key: "basketball", icon: "🏀", centerIds: ["wiru", "ahtme", "spordihoone"], equipmentOptions: ["ball"] },
  { id: "volleyball", key: "volleyball", icon: "🏐", centerIds: ["wiru", "spordihoone"], equipmentOptions: ["ball", "net"] },
  { id: "skating", key: "skating", icon: "⛸️", centerIds: ["jaahall"], equipmentOptions: ["skates", "helmet"] },
  { id: "hockey", key: "hockey", icon: "🏒", centerIds: ["jaahall"], equipmentOptions: ["stick", "helmet", "pads"] },
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
    openingHours: { open: 8, close: 22 },
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
    openingHours: { open: 8, close: 22 },
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
    openingHours: { open: 8, close: 20 },
  },
  {
    id: "spordihoone",
    name: "Kohtla-Järve Spordihoone",
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
    openingHours: { open: 8, close: 21 },
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

export const equipmentPrices: Record<string, number> = {
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
};



export function generateTimeSlots(date: string, centerId: string, sportId: string, bookings: Booking[] = []): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const center = sportCenters.find((c) => c.id === centerId);
  if (!center) return slots;
  const relevantCourts = center.courts.filter((c) => c.sportId === sportId);
  const seed = date.split("-").reduce((a, b) => a + parseInt(b), 0) + centerId.length + sportId.length;

  let hasAvailableSlot = false;
  const { open, close } = center.openingHours;

  // Helper function to check if a time slot is booked
  const isTimeBooked = (courtId: string, time: string, duration: number = 1): boolean => {
    return bookings.some((booking) => {
      if (booking.date !== date || booking.centerId !== centerId || booking.courtId !== courtId) {
        return false;
      }
      const [bookingHour, bookingMin] = booking.time.split(":").map(Number);
      const [slotHour, slotMin] = time.split(":").map(Number);
      
      const bookingStart = bookingHour * 60 + bookingMin;
      const bookingEnd = bookingStart + booking.duration * 60;
      const slotStart = slotHour * 60 + slotMin;
      const slotEnd = slotStart + duration * 60;
      
      // Check for overlap
      return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
    });
  };

  for (let hour = open; hour < close; hour++) {
    // Generate full hour slot
    const timeFullHour = `${hour.toString().padStart(2, "0")}:00`;
    for (const court of relevantCourts) {
      const hash = (seed * (hour + 1) * (court.id.charCodeAt(1) + 1)) % 10;
      // Check if time is booked first, then apply hash-based availability
      const isBooked = isTimeBooked(court.id, timeFullHour);
      const baseAvailable = hour === open || hash > 2;
      const available = !isBooked && baseAvailable;
      slots.push({ time: timeFullHour, available, courtId: court.id });
      if (available) hasAvailableSlot = true;
    }
    
    // Generate half hour slot (only if not the last hour)
    if (hour < close - 1) {
      const timeHalfHour = `${hour.toString().padStart(2, "0")}:30`;
      for (const court of relevantCourts) {
        const hash = (seed * (hour + 0.5) * (court.id.charCodeAt(1) + 1)) % 10;
        const isBooked = isTimeBooked(court.id, timeHalfHour);
        const baseAvailable = hour === open || hash > 2;
        const available = !isBooked && baseAvailable;
        slots.push({ time: timeHalfHour, available, courtId: court.id });
        if (available) hasAvailableSlot = true;
      }
    }
  }
  
  // If no slots were made available, make the first one available
  if (!hasAvailableSlot && slots.length > 0) {
    slots[0].available = true;
  }
  
  return slots;
}

export function isDurationAvailable(
  date: string,
  time: string,
  duration: number,
  centerId: string,
  courtId: string,
  bookings: Booking[]
): boolean {
  // Check if the time slot with this duration overlaps with any existing bookings
  const [timeHour, timeMin] = time.split(":").map(Number);
  const slotStart = timeHour * 60 + timeMin;
  const slotEnd = slotStart + duration * 60;

  return !bookings.some((booking) => {
    if (booking.date !== date || booking.centerId !== centerId || booking.courtId !== courtId) {
      return false;
    }
    const [bookingHour, bookingMin] = booking.time.split(":").map(Number);
    const bookingStart = bookingHour * 60 + bookingMin;
    const bookingEnd = bookingStart + booking.duration * 60;

    // Check for overlap
    return !(slotEnd <= bookingStart || slotStart >= bookingEnd);
  });
}

export function getAvailableTimesWithMinDuration(
  date: string,
  centerId: string,
  sportId: string,
  minDuration: number = 1,
  bookings: Booking[] = []
): string[] {
  const center = sportCenters.find((c) => c.id === centerId);
  if (!center) return [];

  const relevantCourts = center.courts.filter((c) => c.sportId === sportId);
  const { open, close } = center.openingHours;
  const availableTimes = new Set<string>();

  for (let hour = open; hour < close; hour++) {
    // Check full hour slot
    const timeFullHour = `${hour.toString().padStart(2, "0")}:00`;
    for (const court of relevantCourts) {
      if (isDurationAvailable(date, timeFullHour, minDuration, centerId, court.id, bookings)) {
        availableTimes.add(timeFullHour);
        break; // Found at least one court available for this time
      }
    }

    // Check half hour slot (only if not the last hour)
    if (hour < close - 1) {
      const timeHalfHour = `${hour.toString().padStart(2, "0")}:30`;
      for (const court of relevantCourts) {
        if (isDurationAvailable(date, timeHalfHour, minDuration, centerId, court.id, bookings)) {
          availableTimes.add(timeHalfHour);
          break; // Found at least one court available for this time
        }
      }
    }
  }

  return Array.from(availableTimes).sort();
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

export function getBookingsFromStorage(): Booking[] {
  try {
    const stored = localStorage.getItem("bookings");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading bookings from localStorage", e);
  }
  return initialBookings;
}

export const mockGames: OpenGame[] = [
  {
    id: "g1",
    sportId: "basketball",
    centerId: "wiru",
    courtId: "w1",
    date: "2026-03-23",
    time: "18:00",
    duration: 2,
    description: "Sõbralik korvpallimäng kõigile! Tulge mängime ja nautige head aega.",
    level: "intermediate",
    minPlayers: 6,
    maxPlayers: 10,
    registeredPlayers: [{ name: "Andrei I." }, { name: "Viktor K." }, { name: "Elena S." }, { name: "Dmitri P." }],
    creatorName: "Andrei I.",
    equipment: [],
  },
  {
    id: "g2",
    sportId: "volleyball",
    centerId: "spordihoone",
    courtId: "s2",
    date: "2026-03-24",
    time: "19:00",
    duration: 2,
    description: "Võrkpall algajatele — õpime koos! Kõik on oodatud, ka need kes pole varem mänginud.",
    level: "beginner",
    minPlayers: 8,
    maxPlayers: 12,
    registeredPlayers: [{ name: "Maria P." }, { name: "Jelena T." }, { name: "Anna K." }],
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
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In eget elementum velit. Fusce mollis, arcu quis convallis maximus, est elit mollis nunc, sed tempus turpis diam eu leo. Fusce eget gravida erat. Phasellus sed tristique justo. Morbi neque dolor, convallis efficitur lacus et, imperdiet varius est. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquam ipsum id libero tempor consectetur. Suspendisse eu diam eget sem consectetur lacinia et eu ex. Maecenas porta interdum mi, ut fermentum massa condimentum sed. Suspendisse non neque at velit finibus laoreet non sit amet est. Suspendisse leo odio, mollis id sapien sed, bibendum fermentum enim. Vivamus commodo accumsan condimentum. Mauris pharetra eros imperdiet mauris tincidunt dapibus. Quisque nec dignissim dolor. Ut sem lacus, tempor vitae quam quis, consequat ultrices metus. Suspendisse vitae augue imperdiet, pretium elit sed, commodo arcu. Mauris et malesuada lorem. Lorem ipsum dolor sit amet.",
    level: "intermediate",
    minPlayers: 2,
    maxPlayers: 4,
    registeredPlayers: [{ name: "Igor R." }],
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
    description: "Jäähoki trenn kogenud mängijatele. Täisvarustus nõutud!",
    level: "professional",
    minPlayers: 10,
    maxPlayers: 20,
    registeredPlayers: [
      { name: "Aleksei M." }, { name: "Pavel S." }, { name: "Roman K." },
      { name: "Nikita V." }, { name: "Sergei L." }, { name: "Oleg T." },
      { name: "Artem D." },
    ],
    creatorName: "Aleksei M.",
    equipment: ["stick", "helmet", "pads"],
  },
  {
    id: "g5",
    sportId: "tennis",
    centerId: "spordihoone",
    courtId: "s3",
    date: "2026-03-27",
    time: "10:00",
    duration: 1,
    description: "Tennise üksikmäng hommikul. Tule ja tee trenni!",
    level: "beginner",
    minPlayers: 2,
    maxPlayers: 2,
    registeredPlayers: [{ name: "Katrin L." }],
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
    description: "Jalgpallimatš kesktaseme mängijatele. Kogu varustus olemas!",
    level: "intermediate",
    minPlayers: 8,
    maxPlayers: 8,
    registeredPlayers: [
      { name: "Kristjan K." }, { name: "Taavi R." }, { name: "Kristo S." },
      { name: "Jaan T." }, { name: "Rait V." }, { name: "Martin L." },
      { name: "Toomas P." }, { name: "Erik M." },
    ],
    creatorName: "Kristjan K.",
    equipment: ["ball"],
  },
];
