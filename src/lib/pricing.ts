import type { Sport } from "@/types/api";
import type { PricingRule } from "@/types/api";
import type { Lang } from "@/data/translations";

export type ArenaOrganizationType = "registered" | "unregistered";

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
  pricingRules: PricingRule[] = [],
  arenaOrganizationType?: ArenaOrganizationType,
) {
  if (!date || !time) {
    return sport.hourlyPrice;
  }

  const [, month] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const timeMinutes = hour * 60 + minute;
  const day = new Date(`${date}T${time}`).getDay();
  const matchingRule = pricingRules
    .filter((rule) => {
      if (rule.serviceId !== sport.id) return false;
      if (rule.organizationType && rule.organizationType !== arenaOrganizationType) return false;
      if (rule.months.length > 0 && !rule.months.includes(month)) return false;
      if (rule.weekdays.length > 0 && !rule.weekdays.includes(day)) return false;
      if (rule.startMinute !== undefined && timeMinutes < rule.startMinute) return false;
      if (rule.endMinute !== undefined && timeMinutes >= rule.endMinute) return false;
      return true;
    })
    .sort((a, b) => b.priority - a.priority)[0];

  if (matchingRule) {
    return matchingRule.price;
  }

  return sport.hourlyPrice;
}
