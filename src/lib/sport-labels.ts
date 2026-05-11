import type { Lang } from "@/data/translations";
import type { Sport } from "@/types/api";

const labels: Record<string, Record<Lang, string>> = {
  "ahtme-single-ticket": {
    et: "Üksikpilet kergejõustikuareenile ja jõusaali",
    en: "Single ticket for the athletics arena and gym",
    ru: "Разовый билет на легкоатлетическую арену и в тренажерный зал",
  },
  "ahtme-club-training-full": {
    et: "Spordiklubi treening: kergejõustikuareen 1/1",
    en: "Sports club training: athletics arena 1/1",
    ru: "Тренировка спортклуба: легкоатлетическая арена 1/1",
  },
  "ahtme-club-training-half": {
    et: "Spordiklubi treening: kergejõustikuareen 1/2",
    en: "Sports club training: athletics arena 1/2",
    ru: "Тренировка спортклуба: легкоатлетическая арена 1/2",
  },
  "ahtme-club-training-quarter": {
    et: "Spordiklubi treening: kergejõustikuareen 1/4",
    en: "Sports club training: athletics arena 1/4",
    ru: "Тренировка спортклуба: легкоатлетическая арена 1/4",
  },
  "ahtme-club-training-aerobics": {
    et: "Spordiklubi treening: aeroobikasaal",
    en: "Sports club training: aerobics hall",
    ru: "Тренировка спортклуба: зал аэробики",
  },
  "ahtme-club-training-gym": {
    et: "Spordiklubi treening: jõusaal",
    en: "Sports club training: gym",
    ru: "Тренировка спортклуба: тренажерный зал",
  },
  "ahtme-unregistered-event-hall": {
    et: "Registreerimata üritus või võistlus: kergejõustikuhall",
    en: "Unregistered event or competition: athletics hall",
    ru: "Незарегистрированное мероприятие или соревнование: легкоатлетический зал",
  },
  "ahtme-unregistered-event-territory": {
    et: "Registreerimata üritus või võistlus: hall ja territoorium",
    en: "Unregistered event or competition: hall and territory",
    ru: "Незарегистрированное мероприятие или соревнование: зал и территория",
  },
  "ahtme-registered-training-full": {
    et: "Registreeritud treening: kergejõustikuareen 1/1",
    en: "Registered training: athletics arena 1/1",
    ru: "Зарегистрированная тренировка: легкоатлетическая арена 1/1",
  },
  "ahtme-registered-training-half": {
    et: "Registreeritud treening: kergejõustikuareen 1/2",
    en: "Registered training: athletics arena 1/2",
    ru: "Зарегистрированная тренировка: легкоатлетическая арена 1/2",
  },
  "ahtme-registered-training-quarter": {
    et: "Registreeritud treening: kergejõustikuareen 1/4",
    en: "Registered training: athletics arena 1/4",
    ru: "Зарегистрированная тренировка: легкоатлетическая арена 1/4",
  },
  "ahtme-registered-training-aerobics": {
    et: "Registreeritud treening: aeroobikasaal",
    en: "Registered training: aerobics hall",
    ru: "Зарегистрированная тренировка: зал аэробики",
  },
  "ahtme-registered-training-gym": {
    et: "Registreeritud treening: jõusaal",
    en: "Registered training: gym",
    ru: "Зарегистрированная тренировка: тренажерный зал",
  },
  "ahtme-registered-event-hall": {
    et: "Registreeritud üritus või võistlus: kergejõustikuhall",
    en: "Registered event or competition: athletics hall",
    ru: "Зарегистрированное мероприятие или соревнование: легкоатлетический зал",
  },
  "ahtme-registered-event-territory": {
    et: "Registreeritud üritus või võistlus: hall ja territoorium",
    en: "Registered event or competition: hall and territory",
    ru: "Зарегистрированное мероприятие или соревнование: зал и территория",
  },
  "ahtme-school-pe-free": {
    et: "Koolide liikumisõpe, treeningud ja üritused",
    en: "School physical education, training and events",
    ru: "Школьная физкультура, тренировки и мероприятия",
  },
  "ahtme-tennis-court": { et: "Tenniseväljak", en: "Tennis court", ru: "Теннисный корт" },
  "ahtme-volleyball-court": { et: "Võrkpalliväljak", en: "Volleyball court", ru: "Волейбольная площадка" },
  "ahtme-badminton-court": { et: "Sulgpalliväljak", en: "Badminton court", ru: "Площадка для бадминтона" },
  "ahtme-supported-club-training": {
    et: "Toetatavate spordiklubide ja Jõhvi Spordikooli treeningud",
    en: "Training for supported sports clubs and Jõhvi Sports School",
    ru: "Тренировки поддерживаемых спортклубов и Йыхвиской спортшколы",
  },
  "ahtme-supported-prep-time": {
    et: "Toetatavate spordiklubide võistluste ettevalmistamise aeg",
    en: "Preparation time for supported sports club competitions",
    ru: "Время подготовки соревнований поддерживаемых спортклубов",
  },
  "ahtme-unregistered-prep-time": {
    et: "Registreerimata võistluste ja ürituste ettevalmistamise aeg",
    en: "Preparation time for unregistered competitions and events",
    ru: "Время подготовки незарегистрированных соревнований и мероприятий",
  },
  "ahtme-state-school-pe": {
    et: "HTM hallatavate koolide kehaline kasvatus ja üritused",
    en: "Physical education and events for schools managed by the Ministry",
    ru: "Физкультура и мероприятия школ, подведомственных министерству",
  },
  "ahtme-city-event-free": {
    et: "Kohtla-Järve Linnavalitsuse korraldatav võistlus või üritus",
    en: "Competition or event organized by Kohtla-Järve City Government",
    ru: "Соревнование или мероприятие, организованное горуправой Кохтла-Ярве",
  },
  "ahtme-table-tennis": { et: "Lauatennis", en: "Table tennis", ru: "Настольный теннис" },
  "ahtme-private-running-track": { et: "Jooksurada eraisikule", en: "Running track for individuals", ru: "Беговая дорожка для частных лиц" },
  "ahtme-package-arena-gym-tennis-sauna": {
    et: "Pakett: areen, jalgpall, jõusaal, tennis ja saun",
    en: "Package: arena, football, gym, tennis and sauna",
    ru: "Пакет: арена, футбол, тренажерный зал, теннис и сауна",
  },
  "ahtme-package-volleyball-sauna": {
    et: "Pakett: võrkpalliväljak ja saun",
    en: "Package: volleyball court and sauna",
    ru: "Пакет: волейбольная площадка и сауна",
  },
  "ahtme-package-gym-tabletennis-sauna": {
    et: "Pakett: jõusaal, lauatennis ja saun",
    en: "Package: gym, table tennis and sauna",
    ru: "Пакет: тренажерный зал, настольный теннис и сауна",
  },
  "ahtme-family-package": {
    et: "Perepakett: 2 täiskasvanut ja kuni 3 last",
    en: "Family package: 2 adults and up to 3 children",
    ru: "Семейный пакет: 2 взрослых и до 3 детей",
  },
  "ahtme-sauna-small": { et: "Saun kuni 5 inimest", en: "Sauna for up to 5 people", ru: "Сауна до 5 человек" },
  "ahtme-sauna-gym": { et: "Saun ja jõusaal kuni 10 inimest", en: "Sauna and gym for up to 10 people", ru: "Сауна и тренажерный зал до 10 человек" },
  "ahtme-changing-room": {
    et: "Riietusruumi kasutamine võistluste, ürituste või treeningute ajal",
    en: "Changing room use during competitions, events or training",
    ru: "Использование раздевалки во время соревнований, мероприятий или тренировок",
  },
};

const displayNameOverrides: Partial<Record<string, Record<Lang, string>>> = {
  "ahtme-single-ticket": {
    et: "Kergejõustik + jõusaal",
    en: "Athletics + gym",
    ru: "Легкая атлетика + тренажерный зал",
  },
  "ahtme-private-running-track": {
    et: "Jooksurada",
    en: "Running track",
    ru: "Беговая дорожка",
  },
  "ahtme-sauna-small": {
    et: "Saun",
    en: "Sauna",
    ru: "Сауна",
  },
  "ahtme-sauna-gym": {
    et: "Saun + jõusaal",
    en: "Sauna + gym",
    ru: "Сауна + тренажерный зал",
  },
  "ahtme-tennis-court": {
    et: "Tennis",
    en: "Tennis",
    ru: "Теннис",
  },
  "ahtme-volleyball-court": {
    et: "Võrkpall",
    en: "Volleyball",
    ru: "Волейбол",
  },
  "ahtme-badminton-court": {
    et: "Sulgpall",
    en: "Badminton",
    ru: "Бадминтон",
  },
};

export function getLocalizedSportName(
  sport: Sport,
  lang: Lang,
  fallbackNames: Record<string, string>,
) {
  if (displayNameOverrides[sport.id]?.[lang]) {
    return displayNameOverrides[sport.id][lang];
  }

  return labels[sport.id]?.[lang] ?? fallbackNames[sport.key] ?? sport.key;
}
