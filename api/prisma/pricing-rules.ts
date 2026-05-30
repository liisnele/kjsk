const weekdays = [1, 2, 3, 4, 5];
const summerMonths = [6, 7, 8];
const nonSummerMonths = [1, 2, 3, 4, 5, 9, 10, 11, 12];
const daytimeWindow = { startMinute: 7 * 60, endMinute: 15 * 60 };

const seasonalCourtRuleServices = [
  "ahtme-tennis-court",
  "ahtme-volleyball-court",
  "ahtme-badminton-court",
];

const organizationRulePrices = [
  { serviceId: "ahtme-club-training-full", registeredDay: 20, registeredBase: 28, unregisteredDay: 22, unregisteredBase: 30 },
  { serviceId: "ahtme-club-training-half", registeredDay: 12, registeredBase: 15, unregisteredDay: 14, unregisteredBase: 17 },
  { serviceId: "ahtme-club-training-quarter", registeredDay: 6, registeredBase: 8, unregisteredDay: 8, unregisteredBase: 10 },
  { serviceId: "ahtme-club-training-aerobics", registeredDay: 9, registeredBase: 12, unregisteredDay: 10, unregisteredBase: 14 },
  { serviceId: "ahtme-club-training-gym", registeredDay: 7, registeredBase: 10, unregisteredDay: 9, unregisteredBase: 12 },
];

export const pricingRules = [
  ...seasonalCourtRuleServices.flatMap((serviceId) => [
    {
      id: `${serviceId}-summer`,
      serviceId,
      price: 8,
      priority: 10,
      months: summerMonths,
      weekdays: [],
    },
    {
      id: `${serviceId}-summer-daytime`,
      serviceId,
      price: 5,
      priority: 20,
      months: summerMonths,
      weekdays,
      ...daytimeWindow,
    },
    {
      id: `${serviceId}-non-summer-daytime`,
      serviceId,
      price: 7,
      priority: 20,
      months: nonSummerMonths,
      weekdays,
      ...daytimeWindow,
    },
  ]),
  {
    id: "ahtme-table-tennis-summer",
    serviceId: "ahtme-table-tennis",
    price: 2,
    priority: 10,
    months: summerMonths,
    weekdays: [],
  },
  {
    id: "ahtme-table-tennis-non-summer-daytime",
    serviceId: "ahtme-table-tennis",
    price: 3,
    priority: 20,
    months: nonSummerMonths,
    weekdays,
    ...daytimeWindow,
  },
  {
    id: "ahtme-private-running-track-daytime",
    serviceId: "ahtme-private-running-track",
    price: 6,
    priority: 20,
    months: [],
    weekdays,
    ...daytimeWindow,
  },
  ...organizationRulePrices.flatMap((item) => [
    {
      id: `${item.serviceId}-registered-base`,
      serviceId: item.serviceId,
      price: item.registeredBase,
      priority: 10,
      months: [],
      weekdays: [],
      organizationType: "registered",
    },
    {
      id: `${item.serviceId}-registered-daytime`,
      serviceId: item.serviceId,
      price: item.registeredDay,
      priority: 20,
      months: [],
      weekdays,
      organizationType: "registered",
      ...daytimeWindow,
    },
    {
      id: `${item.serviceId}-unregistered-base`,
      serviceId: item.serviceId,
      price: item.unregisteredBase,
      priority: 10,
      months: [],
      weekdays: [],
      organizationType: "unregistered",
    },
    {
      id: `${item.serviceId}-unregistered-daytime`,
      serviceId: item.serviceId,
      price: item.unregisteredDay,
      priority: 20,
      months: [],
      weekdays,
      organizationType: "unregistered",
      ...daytimeWindow,
    },
  ]),
];

export const serializePricingRuleSeed = (rule: (typeof pricingRules)[number]) => ({
  id: rule.id,
  serviceId: rule.serviceId,
  price: rule.price,
  priority: rule.priority,
  months: rule.months,
  weekdays: rule.weekdays,
  startMinute: "startMinute" in rule ? rule.startMinute : undefined,
  endMinute: "endMinute" in rule ? rule.endMinute : undefined,
  organizationType:
    "organizationType" in rule && typeof rule.organizationType === "string"
      ? rule.organizationType
      : undefined,
});
