import type { Sport } from "@/types/api";
import type { Lang } from "@/data/translations";

const seasonalCourtIds = new Set([
  "ahtme-tennis-court",
  "ahtme-volleyball-court",
  "ahtme-badminton-court",
]);

const daytimeDiscountPrices: Record<string, [number, number]> = {
  "ahtme-club-training-full": [22, 30],
  "ahtme-club-training-half": [14, 17],
  "ahtme-club-training-quarter": [8, 10],
  "ahtme-club-training-aerobics": [10, 14],
  "ahtme-club-training-gym": [9, 12],
  "ahtme-registered-training-full": [20, 28],
  "ahtme-registered-training-half": [12, 15],
  "ahtme-registered-training-quarter": [6, 8],
  "ahtme-registered-training-aerobics": [9, 12],
  "ahtme-registered-training-gym": [7, 10],
  "ahtme-private-running-track": [6, 10],
};

export type ArenaOrganizationType = "registered" | "unregistered";

const arenaOrganizationPrices: Record<
  ArenaOrganizationType,
  Record<string, [number, number]>
> = {
  registered: {
    "ahtme-club-training-full": [20, 28],
    "ahtme-club-training-half": [12, 15],
    "ahtme-club-training-quarter": [6, 8],
    "ahtme-club-training-aerobics": [9, 12],
    "ahtme-club-training-gym": [7, 10],
  },
  unregistered: {
    "ahtme-club-training-full": [22, 30],
    "ahtme-club-training-half": [14, 17],
    "ahtme-club-training-quarter": [8, 10],
    "ahtme-club-training-aerobics": [10, 14],
    "ahtme-club-training-gym": [9, 12],
  },
};

const formatPrice = (price: number) =>
  Number.isInteger(price) ? `${price}` : price.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

const priceUnit: Record<Lang, string> = {
  et: "eurot",
  en: "euros",
  ru: "евро",
};

export function getSportPriceRange(sport: Sport, lang: Lang = "et") {
  const min = sport.priceMin || sport.hourlyPrice;
  const max = sport.priceMax || sport.hourlyPrice;
  const unit = priceUnit[lang];

  if (min === max) {
    return `${formatPrice(max)} ${unit}`;
  }

  return `${formatPrice(min)}-${formatPrice(max)} ${unit}`;
}

export function getDurationLabel(minutes: number) {
  if (minutes >= 24 * 60 && minutes % (24 * 60) === 0) {
    return `${minutes / (24 * 60)} x 24 h`;
  }

  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60} h`;
  }

  return `${minutes} min`;
}

export function getSportPriceForDateTime(
  sport: Sport,
  date: string,
  time: string,
  arenaOrganizationType?: ArenaOrganizationType,
) {
  if (!date || !time) {
    return sport.hourlyPrice;
  }

  const [, month] = date.split("-").map(Number);
  const [hour] = time.split(":").map(Number);
  const day = new Date(`${date}T${time}`).getDay();
  const weekday = day >= 1 && day <= 5;
  const daytime = weekday && hour >= 7 && hour < 15;
  const summer = month >= 6 && month <= 8;

  if (sport.id === "ahtme-single-ticket") {
    return sport.hourlyPrice;
  }

  if (seasonalCourtIds.has(sport.id)) {
    if (summer) return daytime ? 5 : 8;
    return daytime ? 7 : 10;
  }

  if (sport.id === "ahtme-table-tennis") {
    if (summer) return 2;
    return daytime ? 3 : 4;
  }

  if (sport.id === "ahtme-state-school-pe") {
    return weekday ? 10 : 15;
  }

  const organizationPrice =
    arenaOrganizationType &&
    arenaOrganizationPrices[arenaOrganizationType]?.[sport.id];
  if (organizationPrice) {
    return daytime ? organizationPrice[0] : organizationPrice[1];
  }

  const daytimePrice = daytimeDiscountPrices[sport.id];
  if (daytimePrice) {
    return daytime ? daytimePrice[0] : daytimePrice[1];
  }

  return sport.hourlyPrice;
}
