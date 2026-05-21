import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { enUS, et, ru } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Folder,
  MapPin,
} from "lucide-react";
import Header from "@/components/Header";
import { Calendar } from "@/components/ui/calendar";
import { useLang } from "@/contexts/LanguageContext";
import {
  useBookingsQuery,
  useCatalogQuery,
  useCreateBookingMutation,
} from "@/hooks/use-api-data";
import { generateTimeSlots } from "@/lib/availability";
import {
  type ArenaOrganizationType,
  getDurationLabel,
  getSportPriceForDateTime,
  getSportPriceRange,
} from "@/lib/pricing";
import { getLocalizedSportName } from "@/lib/sport-labels";
import { cn } from "@/lib/utils";

type ServiceCategoryId =
  | "individual"
  | "packages"
  | "clubsAndSchools";

const serviceCategoryIds: ServiceCategoryId[] = [
  "individual",
  "packages",
  "clubsAndSchools",
];

const serviceCategoryBySportId: Record<string, ServiceCategoryId> = {
  "ahtme-single-ticket": "individual",
  "ahtme-tennis-court": "individual",
  "ahtme-volleyball-court": "individual",
  "ahtme-badminton-court": "individual",
  "ahtme-table-tennis": "individual",
  "ahtme-private-running-track": "individual",
  "ahtme-package-arena-gym-tennis-sauna": "packages",
  "ahtme-package-volleyball-sauna": "packages",
  "ahtme-package-gym-tabletennis-sauna": "packages",
  "ahtme-family-package": "packages",
  "ahtme-sauna-small": "individual",
  "ahtme-sauna-gym": "individual",
  "ahtme-school-pe-free": "clubsAndSchools",
  "ahtme-state-school-pe": "clubsAndSchools",
  "ahtme-club-training-full": "clubsAndSchools",
  "ahtme-club-training-half": "clubsAndSchools",
  "ahtme-club-training-quarter": "clubsAndSchools",
  "ahtme-club-training-aerobics": "clubsAndSchools",
  "ahtme-club-training-gym": "clubsAndSchools",
  "ahtme-registered-training-full": "clubsAndSchools",
  "ahtme-registered-training-half": "clubsAndSchools",
  "ahtme-registered-training-quarter": "clubsAndSchools",
  "ahtme-registered-training-aerobics": "clubsAndSchools",
  "ahtme-registered-training-gym": "clubsAndSchools",
  "ahtme-supported-club-training": "clubsAndSchools",
};

const getServiceCategory = (sportId: string): ServiceCategoryId =>
  serviceCategoryBySportId[sportId] ?? "individual";

const hiddenSportIds = new Set([
  "ahtme-unregistered-event-hall",
  "ahtme-unregistered-event-territory",
  "ahtme-unregistered-prep-time",
  "ahtme-registered-event-hall",
  "ahtme-registered-event-territory",
  "ahtme-supported-prep-time",
  "ahtme-city-event-free",
  "ahtme-registered-training-full",
  "ahtme-registered-training-half",
  "ahtme-registered-training-quarter",
  "ahtme-registered-training-aerobics",
  "ahtme-registered-training-gym",
]);

const arenaOrganizationSportIds = new Set([
  "ahtme-club-training-full",
  "ahtme-club-training-half",
  "ahtme-club-training-quarter",
  "ahtme-club-training-aerobics",
  "ahtme-club-training-gym",
]);

const serviceNotes: Record<string, Record<"et" | "en" | "ru", string>> = {
  "ahtme-table-tennis": {
    et: "Sisaldab reketite ja pallide laenutust",
    en: "Includes racket and ball rental",
    ru: "Включает прокат ракеток и мячей",
  },
  "ahtme-sauna-small": {
    et: "Maksimaalselt 5 inimest",
    en: "Maximum 5 people",
    ru: "Максимум 5 человек",
  },
  "ahtme-sauna-gym": {
    et: "Maksimaalselt 10 inimest",
    en: "Maximum 10 people",
    ru: "Максимум 10 человек",
  },
  "ahtme-family-package": {
    et: "2 täiskasvanut ja kuni 3 last",
    en: "2 adults and up to 3 children",
    ru: "2 взрослых и до 3 детей",
  },
};

export default function BookingPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: catalog, isLoading } = useCatalogQuery();
  const { data: bookings = [] } = useBookingsQuery();
  const createBookingMutation = useCreateBookingMutation();

  const sports = catalog?.sports ?? [];
  const sportCenters = catalog?.sportCenters ?? [];
  const sportPrices = catalog?.sportPrices ?? {};
  const equipmentPrices = catalog?.equipmentPrices ?? {};

  const initialSport = searchParams.get("sport") || "";
  const initialCenter = searchParams.get("center") || "";
  const initialStep = initialCenter && initialSport ? 3 : initialCenter ? 2 : 1;

  const [step, setStep] = useState(initialStep);
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [selectedCenter, setSelectedCenter] = useState(initialCenter);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    participants: "" as number | "",
    adultTickets: 1,
    discountTickets: 0,
    arenaOrganizationType: "registered" as ArenaOrganizationType,
    equipment: [] as string[],
    note: "",
  });
  const [expandedServiceCategories, setExpandedServiceCategories] = useState<
    Record<ServiceCategoryId, boolean>
  >({
    individual: true,
    packages: false,
    clubsAndSchools: false,
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const stepLabels = [
    t.booking.step1,
    t.booking.step2,
    t.booking.step3,
    t.booking.step4,
  ];

  const availableCenters = useMemo(() => {
    if (!selectedSport) return sportCenters;
    return sportCenters.filter((center) => center.sportIds.includes(selectedSport));
  }, [selectedSport, sportCenters]);

  const availableSports = useMemo(() => {
    const visibleSports = sports.filter((sport) => !hiddenSportIds.has(sport.id));

    if (!selectedCenter) return visibleSports;
    const center = sportCenters.find((item) => item.id === selectedCenter);
    return center
      ? visibleSports.filter((sport) => center.sportIds.includes(sport.id))
      : visibleSports;
  }, [selectedCenter, sportCenters, sports]);

  const groupedAvailableSports = useMemo(
    () =>
      serviceCategoryIds
        .map((id) => ({
          id,
          sports: availableSports.filter(
            (sport) => getServiceCategory(sport.id) === id,
          ),
        }))
        .filter((group) => group.sports.length > 0),
    [availableSports],
  );

  const selectedSportData = sports.find((sport) => sport.id === selectedSport);
  const selectedDurationMinutes = selectedSportData?.durationMinutes ?? 60;
  const isSingleTicket = selectedSportData?.id === "ahtme-single-ticket";
  const isArenaOrganizationBooking =
    !!selectedSportData && arenaOrganizationSportIds.has(selectedSportData.id);
  const participantLimit =
    selectedSportData?.id === "ahtme-sauna-small"
      ? 5
      : selectedSportData?.id === "ahtme-sauna-gym"
        ? 10
        : 50;
  const ticketText = {
    et: {
      type: "Pileti tüüp",
      adult: "Täiskasvanu",
      discount: "Laps / sooduspilet",
      countRequired: "Vali vähemalt üks pilet.",
    },
    en: {
      type: "Ticket type",
      adult: "Adult",
      discount: "Child / discount ticket",
      countRequired: "Choose at least one ticket.",
    },
    ru: {
      type: "Тип билета",
      adult: "Взрослый",
      discount: "Ребенок / льготный билет",
      countRequired: "Выберите хотя бы один билет.",
    },
  }[lang];
  const arenaOrganizationText = {
    et: {
      type: "Organisatsiooni tüüp",
      registered: "K-J haldusterritooriumil registreeritud organisatsioon",
      unregistered: "Registreerimata organisatsioon",
    },
    en: {
      type: "Organization type",
      registered: "Organization registered in K-J administrative territory",
      unregistered: "Unregistered organization",
    },
    ru: {
      type: "Тип организации",
      registered: "Организация, зарегистрированная на административной территории К-Й",
      unregistered: "Незарегистрированная организация",
    },
  }[lang];
  const serviceCategoryText = {
    et: {
      individual: "Spordi ajad üksikinimesele",
      packages: "Paketid",
      clubsAndSchools: "Spordiklubid ja koolid",
    },
    en: {
      individual: "Individual sport times",
      packages: "Packages",
      clubsAndSchools: "Sports clubs and schools",
    },
    ru: {
      individual: "Индивидуальные спортивные бронирования",
      packages: "Пакеты",
      clubsAndSchools: "Спортивные клубы и школы",
    },
  }[lang];
  const validationText = {
    et: {
      nameRequired: "Nimi on kohustuslik.",
      emailRequired: "E-post on kohustuslik.",
      emailInvalid: "E-posti aadress ei ole korrektne.",
      phoneRequired: "Telefoni number on kohustuslik.",
      phoneInvalid: "Telefoni number ei ole korrektne.",
      participantsRequired: "Osalejate arv on kohustuslik.",
      participantsInvalid: "Osalejate arv peab olema vähemalt 1.",
      participantsMax: (max: number) =>
        `Osalejate arv võib olla maksimaalselt ${max}.`,
    },
    en: {
      nameRequired: "Name is required.",
      emailRequired: "Email is required.",
      emailInvalid: "Email address is not valid.",
      phoneRequired: "Phone number is required.",
      phoneInvalid: "Phone number is not valid.",
      participantsRequired: "Number of participants is required.",
      participantsInvalid: "Number of participants must be at least 1.",
      participantsMax: (max: number) =>
        `Number of participants can be at most ${max}.`,
    },
    ru: {
      nameRequired: "Имя обязательно.",
      emailRequired: "Эл. почта обязательна.",
      emailInvalid: "Адрес эл. почты указан неверно.",
      phoneRequired: "Номер телефона обязателен.",
      phoneInvalid: "Номер телефона указан неверно.",
      participantsRequired: "Количество участников обязательно.",
      participantsInvalid: "Количество участников должно быть не меньше 1.",
      participantsMax: (max: number) =>
        `Количество участников не может быть больше ${max}.`,
    },
  }[lang];

  const timeSlots = useMemo(() => {
    if (!selectedCenter || !selectedSport) return [];
    return generateTimeSlots(
      dateStr,
      selectedCenter,
      selectedSport,
      sportCenters,
      bookings,
      selectedDurationMinutes,
    );
  }, [bookings, dateStr, selectedCenter, selectedDurationMinutes, selectedSport, sportCenters]);

  const selectedCenterData = sportCenters.find((center) => center.id === selectedCenter);
  const courtsForSport =
    selectedCenterData?.courts.filter((court) => court.sportId === selectedSport) ?? [];

  const effectiveCourtId = selectedCourt || courtsForSport[0]?.id || "";

  const equipmentTotal = useMemo(
    () =>
      form.equipment.reduce(
        (total, item) => total + (equipmentPrices[item] || 0),
        0,
      ),
    [equipmentPrices, form.equipment],
  );
  const singleTicketParticipants = form.adultTickets + form.discountTickets;
  const singleTicketTotal = form.adultTickets * 6 + form.discountTickets * 4;

  const totalPrice = useMemo(
    () =>
      (isSingleTicket
        ? singleTicketTotal
        : selectedSportData
          ? getSportPriceForDateTime(
              selectedSportData,
              dateStr,
              selectedTime,
              isArenaOrganizationBooking ? form.arenaOrganizationType : undefined,
            )
          : sportPrices[selectedSport] || 0) + equipmentTotal,
    [
      dateStr,
      equipmentTotal,
      singleTicketTotal,
      form.arenaOrganizationType,
      isArenaOrganizationBooking,
      isSingleTicket,
      selectedSport,
      selectedSportData,
      selectedTime,
      sportPrices,
    ],
  );
  const bookingRentalPrice = totalPrice - equipmentTotal;
  const formatBookingPrice = (price: number) => `${price} \u20ac`;
  const calendarLocale = lang === "ru" ? ru : lang === "en" ? enUS : et;
  const centerDescriptionLang = lang === "ru" ? "en" : lang;
  const courtCountLabel = (count: number) => {
    if (lang === "et") {
      return count === 1 ? "väljak" : "väljakut";
    }

    if (lang === "ru") {
      return count === 1 ? "площадка" : count > 1 && count < 5 ? "площадки" : "площадок";
    }

    return count === 1 ? "court" : "courts";
  };
  const getSportName = (sport: typeof sports[number]) =>
    getLocalizedSportName(sport, lang, t.sportNames);
  const getServiceNote = (sportId: string) => serviceNotes[sportId]?.[lang] ?? "";
  const emailValue = form.email.trim();
  const phoneValue = form.phone.trim();
  const participantValue =
    form.participants === "" ? Number.NaN : Number(form.participants);
  const effectiveParticipantValue = isSingleTicket
    ? singleTicketParticipants
    : participantValue;
  const phoneDigits = phoneValue.replace(/\D/g, "").length;
  const step4ValidationMessages = [
    !form.name.trim() ? validationText.nameRequired : "",
    !emailValue
      ? validationText.emailRequired
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
        ? ""
        : validationText.emailInvalid,
    !phoneValue
      ? validationText.phoneRequired
      : /^\+?[0-9\s()-]+$/.test(phoneValue) && phoneDigits >= 7
        ? ""
        : validationText.phoneInvalid,
    isSingleTicket && singleTicketParticipants < 1
      ? ticketText.countRequired
      : "",
    !isSingleTicket && form.participants === ""
      ? validationText.participantsRequired
      : isSingleTicket || (Number.isInteger(participantValue) && participantValue >= 1)
        ? ""
        : validationText.participantsInvalid,
    effectiveParticipantValue > participantLimit
      ? validationText.participantsMax(participantLimit)
      : "",
  ].filter(Boolean);

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedCenter;
      case 2:
        return !!selectedSport;
      case 3:
        return !!selectedTime && !!effectiveCourtId;
      case 4:
        return step4ValidationMessages.length === 0;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (canProceed()) {
      setStep(step + 1);
    }
  };

  const handleConfirm = async () => {
    if (!effectiveCourtId) {
      return;
    }

    await createBookingMutation.mutateAsync({
      sportId: selectedSport,
      centerId: selectedCenter,
      courtId: effectiveCourtId,
      date: dateStr,
      time: selectedTime,
      duration: selectedDurationMinutes,
      name: form.name,
      email: form.email,
      phone: form.phone,
      participants: isSingleTicket
        ? singleTicketParticipants
        : Number(form.participants),
      equipment: form.equipment,
      note: [
        isSingleTicket
          ? `${ticketText.adult}: ${form.adultTickets}, ${ticketText.discount}: ${form.discountTickets}`
          : "",
        isArenaOrganizationBooking
          ? `${arenaOrganizationText.type}: ${
              form.arenaOrganizationType === "registered"
                ? arenaOrganizationText.registered
                : arenaOrganizationText.unregistered
            }`
          : "",
        form.note,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    setStep(5);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-10 text-muted-foreground">Loading booking data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold">{t.booking.title}</h1>

        <div className="mt-8 flex items-center gap-2">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  index + 1 < step
                    ? "bg-sport-dark text-white"
                    : index + 1 === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {index + 1 < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium md:block",
                  index + 1 === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {index < stepLabels.length - 1 && (
                <div className="mx-1 h-px w-6 bg-border md:w-12" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10">
          {step === 1 && (
            <div>
              <h2 className="mb-6 font-display text-xl font-semibold">
                {t.booking.selectCenter}
              </h2>
              {availableCenters.length === 0 ? (
                <p className="text-muted-foreground">{t.booking.noResults}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {availableCenters.map((center) => (
                    <button
                      key={center.id}
                      onClick={() => {
                        setSelectedCenter(center.id);
                        if (selectedSport && !center.sportIds.includes(selectedSport)) {
                          setSelectedSport("");
                        }
                        setSelectedCourt("");
                        setSelectedTime("");
                      }}
                      className={cn(
                        "sport-card text-left",
                        selectedCenter === center.id &&
                          "ring-2 ring-primary bg-sport-yellow-light",
                      )}
                    >
                      <h3 className="font-display font-semibold">{center.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {center.location}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {center.description[centerDescriptionLang]}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-6 font-display text-xl font-semibold">
                {t.booking.selectSport}
              </h2>
              {availableSports.length === 0 ? (
                <p className="text-muted-foreground">{t.booking.noResults}</p>
              ) : (
                <div className="space-y-4">
                  {groupedAvailableSports.map((group) =>
                    group.id === "individual" ? (
                      <div
                        key={group.id}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
                      >
                        {group.sports.map((sport) => {
                          const courtsCount =
                            selectedCenterData?.courts.filter(
                              (court) => court.sportId === sport.id,
                            ).length || 0;

                          return (
                            <button
                              key={sport.id}
                              onClick={() => {
                                setSelectedSport(sport.id);
                                setSelectedCourt("");
                                setSelectedTime("");
                              }}
                              className={cn(
                                "sport-card flex flex-col items-center gap-2 py-5",
                                selectedSport === sport.id &&
                                  "ring-2 ring-primary bg-sport-yellow-light",
                              )}
                            >
                              <span className="text-center text-base font-semibold">
                                {getSportName(sport)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getSportPriceRange(sport, lang)} ·{" "}
                                {getDurationLabel(sport.durationMinutes)}
                                {" · "}
                                {courtsCount} {courtCountLabel(courtsCount)}
                              </span>
                              {getServiceNote(sport.id) && (
                                <span className="text-center text-xs text-muted-foreground">
                                  {getServiceNote(sport.id)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <section
                        key={group.id}
                        className="rounded-xl border border-border bg-card"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedServiceCategories((current) => ({
                              ...current,
                              [group.id]: !current[group.id],
                            }))
                          }
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <span className="flex min-w-0 items-center gap-2 font-display text-base font-semibold">
                            <Folder className="h-4 w-4 shrink-0 text-primary" />
                            <span>{serviceCategoryText[group.id]}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                            {group.sports.length}
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                expandedServiceCategories[group.id] && "rotate-180",
                              )}
                            />
                          </span>
                        </button>

                        {expandedServiceCategories[group.id] && (
                          <div className="grid grid-cols-2 gap-3 border-t border-border p-3 sm:grid-cols-3 md:grid-cols-5">
                          {group.sports.map((sport) => {
                            const courtsCount =
                              selectedCenterData?.courts.filter(
                                (court) => court.sportId === sport.id,
                              ).length || 0;

                            return (
                              <button
                                key={sport.id}
                                onClick={() => {
                                  setSelectedSport(sport.id);
                                  setSelectedCourt("");
                                  setSelectedTime("");
                                }}
                                className={cn(
                                  "sport-card flex flex-col items-center gap-2 py-5",
                                  selectedSport === sport.id &&
                                    "ring-2 ring-primary bg-sport-yellow-light",
                                )}
                              >
                                <span className="text-center text-base font-semibold">
                                  {getSportName(sport)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getSportPriceRange(sport, lang)} ·{" "}
                                  {getDurationLabel(sport.durationMinutes)}
                                  {" · "}
                                  {courtsCount} {courtCountLabel(courtsCount)}
                                </span>
                                {getServiceNote(sport.id) && (
                                  <span className="text-center text-xs text-muted-foreground">
                                    {getServiceNote(sport.id)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          </div>
                        )}
                      </section>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-8 lg:flex-row">
              <div>
                <h2 className="mb-4 font-display text-xl font-semibold">
                  {t.booking.selectDate}
                </h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={calendarLocale}
                  className="pointer-events-auto rounded-2xl border border-border bg-card p-4"
                  disabled={{
                    before: new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      new Date().getDate(),
                    ),
                  }}
                />
              </div>

              <div className="flex-1">
                <h2 className="mb-4 font-display text-xl font-semibold">
                  {t.booking.selectTime}
                </h2>

                {courtsForSport.length > 1 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {courtsForSport.map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          setSelectedCourt(court.id);
                          setSelectedTime("");
                        }}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                          effectiveCourtId === court.id
                            ? "bg-sport-dark text-white"
                            : "bg-secondary hover:bg-secondary/80",
                        )}
                      >
                        {court.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {timeSlots
                    .filter((slot) => slot.courtId === effectiveCourtId)
                    .map((slot) => (
                      <button
                        key={`${slot.courtId}-${slot.time}`}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "rounded-xl py-3 text-sm font-medium transition-all",
                          !slot.available
                            ? "cursor-not-allowed bg-secondary/50 text-muted-foreground/40 line-through"
                            : selectedTime === slot.time
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border hover:bg-secondary active:scale-95",
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mx-auto max-w-lg">
              <h2 className="mb-6 font-display text-xl font-semibold">
                {t.booking.step4}
              </h2>
              <div className="flex flex-col gap-4">
                <input
                  placeholder={t.booking.fullName}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="email"
                  placeholder={t.booking.email}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder={t.booking.phone}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {!isSingleTicket && (
                  <input
                    type="number"
                    min={1}
                    max={participantLimit}
                    placeholder={t.booking.participantsPlaceholder}
                    value={form.participants}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "") {
                        setForm({ ...form, participants: "" });
                        return;
                      }

                      setForm({ ...form, participants: Number(value) });
                    }}
                    className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                )}

                {isSingleTicket && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {ticketText.type}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "adultTickets" as const,
                          label: ticketText.adult,
                          price: 6,
                        },
                        {
                          id: "discountTickets" as const,
                          label: ticketText.discount,
                          price: 4,
                        },
                      ].map((option) => (
                        <label
                          key={option.id}
                          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
                        >
                          <span className="block">{option.label}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {formatBookingPrice(option.price)}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={form[option.id]}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                [option.id]: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              })
                            }
                            className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {t.booking.participants}: {singleTicketParticipants}
                    </div>
                  </div>
                )}

                {isArenaOrganizationBooking && selectedSportData && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {arenaOrganizationText.type}
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        {
                          id: "registered" as const,
                          label: arenaOrganizationText.registered,
                        },
                        {
                          id: "unregistered" as const,
                          label: arenaOrganizationText.unregistered,
                        },
                      ].map((option) => {
                        const price = getSportPriceForDateTime(
                          selectedSportData,
                          dateStr,
                          selectedTime,
                          option.id,
                        );

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                arenaOrganizationType: option.id,
                              })
                            }
                            className={cn(
                              "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all active:scale-95",
                              form.arenaOrganizationType === option.id
                                ? "border-primary bg-sport-yellow-light ring-2 ring-primary"
                                : "border-border bg-card hover:bg-secondary",
                            )}
                          >
                            <span className="block">{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatBookingPrice(price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedSportData && selectedSportData.equipmentOptions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {t.booking.equipment}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSportData.equipmentOptions.map((equipmentId) => (
                        <button
                          key={equipmentId}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              equipment: form.equipment.includes(equipmentId)
                                ? form.equipment.filter((item) => item !== equipmentId)
                                : [...form.equipment, equipmentId],
                            });
                          }}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                            form.equipment.includes(equipmentId)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary hover:bg-secondary/80",
                          )}
                        >
                          {t.equipmentNames[equipmentId as keyof typeof t.equipmentNames]} ·{" "}
                          {formatBookingPrice(equipmentPrices[equipmentId] || 0)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  placeholder={t.booking.note}
                  value={form.note}
                  onChange={(event) => setForm({ ...form, note: event.target.value })}
                  rows={3}
                  className="resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {step4ValidationMessages.length > 0 && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {step4ValidationMessages.map((message) => (
                      <p key={message}>{message}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sport-success/10">
                <Check className="h-10 w-10 text-sport-success" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">
                {t.booking.success}
              </h2>
              <p className="mt-2 text-muted-foreground">{t.booking.successDesc}</p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.step1}</span>
                    <span className="font-medium">{selectedCenterData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.step2}</span>
                    <span className="font-medium">
                      {selectedSportData
                        ? getSportName(selectedSportData)
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.step3}</span>
                    <span className="font-medium">
                      {format(selectedDate, "dd.MM.yyyy")} {selectedTime} ({getDurationLabel(selectedDurationMinutes)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.participants}</span>
                    <span className="font-medium">
                      {isSingleTicket ? singleTicketParticipants : form.participants}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.fullName}</span>
                    <span className="font-medium">{form.name}</span>
                  </div>
                  {form.equipment.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t.booking.courtRental}:</span>
                        <span>{formatBookingPrice(bookingRentalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t.booking.equipmentCost}:</span>
                        <span>{formatBookingPrice(equipmentTotal)}</span>
                      </div>
                      <div className="border-t border-border pt-1" />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.price}</span>
                    <span className="font-bold text-foreground">
                      {formatBookingPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="rounded-2xl border-2 border-border px-6 py-3 font-display font-semibold transition-all hover:bg-secondary active:scale-[0.97]"
                >
                  {t.booking.backHome}
                </button>
              </div>
            </div>
          )}
        </div>

        {step >= 1 && step <= 4 && (
          <div className="mt-10 flex justify-between">
            <button
              disabled={step === 1}
              onClick={() => {
                if (step > 1) {
                  setStep(step - 1);
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all active:scale-95",
                step === 1
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-secondary",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              {t.booking.back}
            </button>
            {step < 4 ? (
              <button
                disabled={!canProceed()}
                onClick={goNext}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95",
                  canProceed()
                    ? "bg-primary text-primary-foreground hover:brightness-105"
                    : "cursor-not-allowed bg-secondary text-muted-foreground",
                )}
              >
                {t.booking.next}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled={!canProceed() || createBookingMutation.isPending}
                onClick={() => void handleConfirm()}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95",
                  canProceed() && !createBookingMutation.isPending
                    ? "bg-sport-dark text-white hover:bg-sport-dark/90"
                    : "cursor-not-allowed bg-secondary text-muted-foreground",
                )}
              >
                <Check className="h-4 w-4" />
                {createBookingMutation.isPending ? "Saving..." : t.booking.confirm}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


