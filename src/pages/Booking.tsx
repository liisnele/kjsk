import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { sports, sportCenters, sportPrices, equipmentPrices, generateTimeSlots, getBookingsFromStorage, Booking } from "@/data/mockData";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Check, MapPin, Star, ArrowLeft, ArrowRight } from "lucide-react";
import Header from "@/components/Header";

type StartMode = "sport" | "center" | null;

export default function BookingPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine initial state from URL params
  const initialSport = searchParams.get("sport") || "";
  const initialCenter = searchParams.get("center") || "";
  const initialMode: StartMode = initialSport ? "sport" : initialCenter ? "center" : null;
  const initialStep = initialSport || initialCenter ? 2 : 1;

  const [startMode, setStartMode] = useState<StartMode>(initialMode);
  const [step, setStep] = useState(initialStep);
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [selectedCenter, setSelectedCenter] = useState(initialCenter);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState("");
  const [bookings] = useState(() => getBookingsFromStorage());
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    clubId: "",
    participants: 1,
    equipment: [] as string[],
    note: "",
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const stepLabels = [t.booking.step1, t.booking.step2, t.booking.step3, t.booking.step4, t.booking.step5];

  // Centers available for selected sport
  const availableCenters = useMemo(() => {
    if (!selectedSport) return sportCenters;
    return sportCenters.filter((c) => c.sportIds.includes(selectedSport));
  }, [selectedSport]);

  // Sports available at selected center
  const availableSports = useMemo(() => {
    if (!selectedCenter) return sports;
    const center = sportCenters.find((c) => c.id === selectedCenter);
    return center ? sports.filter((s) => center.sportIds.includes(s.id)) : sports;
  }, [selectedCenter]);

  const timeSlots = useMemo(() => {
    if (!selectedCenter || !selectedSport) return [];
    return generateTimeSlots(dateStr, selectedCenter, selectedSport, bookings);
  }, [dateStr, selectedCenter, selectedSport, bookings]);

  const selectedSportData = sports.find((s) => s.id === selectedSport);
  const selectedCenterData = sportCenters.find((c) => c.id === selectedCenter);

  const courtsForSport = selectedCenterData?.courts.filter(
    (c) => c.sportId === selectedSport
  ) || [];

  const equipmentTotal = useMemo(() => {
    return form.equipment.reduce((total, eq) => total + (equipmentPrices[eq] || 0), 0);
  }, [form.equipment]);

  const totalPrice = useMemo(() => {
    return sportPrices[selectedSport] * selectedDuration + equipmentTotal;
  }, [selectedSport, selectedDuration, equipmentTotal]);

  const handleConfirm = () => {
    const booking: Booking = {
      id: `b${Date.now()}`,
      sportId: selectedSport,
      centerId: selectedCenter,
      date: dateStr,
      time: selectedTime,
      duration: selectedDuration,
      name: form.name,
      email: form.email,
      phone: form.phone,
      participants: form.participants,
      status: "confirmed",
      courtId: selectedCourt,
    };
    const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
    localStorage.setItem("bookings", JSON.stringify([...existing, booking]));
    setStep(5);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return startMode === "sport" ? !!selectedSport : !!selectedCenter;
      case 2: return startMode === "sport" ? !!selectedCenter : !!selectedSport;
      case 3: return !!selectedTime && !!selectedCourt;
      case 4: return !!form.name && !!form.email && !!form.phone;
      default: return false;
    }
  };

  const goNext = () => {
    if (canProceed()) setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold">{t.booking.title}</h1>

        {/* Stepper */}
        <div className="mt-8 flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  i + 1 < step
                    ? "bg-sport-dark text-white"
                    : i + 1 === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium md:block",
                  i + 1 === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {i < stepLabels.length - 1 && (
                <div className="mx-1 h-px w-6 bg-border md:w-12" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="mt-10">
          {/* STEP 1: Choose mode + first selection */}
          {step === 1 && (
            <div>
              {!startMode && (
                <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
                  <p className="text-lg font-medium">{t.booking.selectSport}</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStartMode("sport")}
                      className="rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97]"
                    >
                      {t.booking.startWithSport}
                    </button>
                    <button
                      onClick={() => setStartMode("center")}
                      className="rounded-2xl border-2 border-border px-6 py-3 font-display font-semibold transition-all hover:bg-secondary active:scale-[0.97]"
                    >
                      {t.booking.startWithCenter}
                    </button>
                  </div>
                </div>
              )}

              {startMode === "sport" && (
                <div>
                  <h2 className="mb-6 font-display text-xl font-semibold">{t.booking.selectSport}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {sports.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => setSelectedSport(sport.id)}
                        className={cn(
                          "sport-card flex flex-col items-center gap-2 py-5",
                          selectedSport === sport.id && "ring-2 ring-primary bg-sport-yellow-light"
                        )}
                      >
                        <span className="text-2xl">{sport.icon}</span>
                        <span className="text-sm font-medium">
                          {t.sportNames[sport.key as keyof typeof t.sportNames]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          €{sportPrices[sport.id]}/h
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {startMode === "center" && (
                <div>
                  <h2 className="mb-6 font-display text-xl font-semibold">{t.booking.selectCenter}</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sportCenters.map((center) => (
                      <button
                        key={center.id}
                        onClick={() => setSelectedCenter(center.id)}
                        className={cn(
                          "sport-card text-left",
                          selectedCenter === center.id && "ring-2 ring-primary bg-sport-yellow-light"
                        )}
                      >
                        <h3 className="font-display font-semibold">{center.name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {center.location}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{center.description[lang]}</p>
                        <div className="mt-3 flex items-center gap-1 text-sm font-medium">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {center.rating}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: second selection (opposite of step 1) */}
          {step === 2 && startMode === "sport" && (
            <div>
              <h2 className="mb-6 font-display text-xl font-semibold">{t.booking.selectCenter}</h2>
              {availableCenters.length === 0 ? (
                <p className="text-muted-foreground">{t.booking.noResults}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {availableCenters.map((center) => {
                    const courtsCount = center.courts.filter(
                      (c) => c.sportId === selectedSport
                    ).length;
                    return (
                      <button
                        key={center.id}
                        onClick={() => setSelectedCenter(center.id)}
                        className={cn(
                          "sport-card text-left",
                          selectedCenter === center.id && "ring-2 ring-primary bg-sport-yellow-light"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-display font-semibold">{center.name}</h3>
                            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {center.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            {center.rating}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{center.description[lang]}</p>
                        <div className="mt-3 flex items-center gap-3 text-sm">
                          <span className="font-medium">€{sportPrices[selectedSport]}/h</span>
                          <span className="text-muted-foreground">{courtsCount} {t.booking.courts}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && startMode === "center" && (
            <div>
              <h2 className="mb-6 font-display text-xl font-semibold">{t.booking.selectSport}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {availableSports.map((sport) => {
                  const courtsCount = selectedCenterData?.courts.filter(
                    (c) => c.sportId === sport.id
                  ).length || 0;
                  return (
                    <button
                      key={sport.id}
                      onClick={() => setSelectedSport(sport.id)}
                      className={cn(
                        "sport-card flex flex-col items-center gap-2 py-5",
                        selectedSport === sport.id && "ring-2 ring-primary bg-sport-yellow-light"
                      )}
                    >
                      <span className="text-2xl">{sport.icon}</span>
                      <span className="text-sm font-medium">
                        {t.sportNames[sport.key as keyof typeof t.sportNames]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        €{sportPrices[sport.id]}/h · {courtsCount} {t.booking.courts}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Date & Time */}
          {step === 3 && (
            <div className="flex flex-col gap-8 lg:flex-row">
              <div>
                <h2 className="mb-4 font-display text-xl font-semibold">{t.booking.selectDate}</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className="rounded-2xl border border-border bg-card p-4 pointer-events-auto"
                />

                {/* Duration */}
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">{t.booking.timeBlock}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((h) => (
                      <button
                        key={h}
                        onClick={() => setSelectedDuration(h)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95",
                          selectedDuration === h
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                        )}
                      >
                        {h} {t.booking.hours}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="mb-4 font-display text-xl font-semibold">{t.booking.selectTime}</h2>

                {/* Court selector */}
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
                          selectedCourt === court.id
                            ? "bg-sport-dark text-white"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {court.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Auto select first court */}
                {courtsForSport.length === 1 && !selectedCourt && (() => { setSelectedCourt(courtsForSport[0].id); return null; })()}

                {/* Time grid */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                  {timeSlots
                    .filter((s) => s.courtId === (selectedCourt || courtsForSport[0]?.id))
                    .map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "rounded-xl py-3 text-sm font-medium transition-all",
                          !slot.available
                            ? "cursor-not-allowed bg-secondary/50 text-muted-foreground/40 line-through"
                            : selectedTime === slot.time
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border hover:bg-secondary active:scale-95"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Form */}
          {step === 4 && (
            <div className="mx-auto max-w-lg">
              <h2 className="mb-6 font-display text-xl font-semibold">{t.booking.step4}</h2>
              <div className="flex flex-col gap-4">
                <input
                  placeholder={t.booking.fullName}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="email"
                  placeholder={t.booking.email}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder={t.booking.phone}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder={t.booking.clubId}
                  value={form.clubId}
                  onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="number"
                  min={1}
                  placeholder={t.booking.participants}
                  value={form.participants}
                  onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                {/* Equipment */}
                {selectedSportData && selectedSportData.equipmentOptions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t.booking.equipment}</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSportData.equipmentOptions.map((eq) => (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,
                              equipment: form.equipment.includes(eq)
                                ? form.equipment.filter((e) => e !== eq)
                                : [...form.equipment, eq],
                            });
                          }}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                            form.equipment.includes(eq)
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary hover:bg-secondary/80"
                          )}
                        >
                          {t.equipmentNames[eq as keyof typeof t.equipmentNames]} · €{equipmentPrices[eq] || 0}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  placeholder={t.booking.note}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  className="rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Confirmation */}
          {step === 5 && (
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sport-success/10">
                <Check className="h-10 w-10 text-sport-success" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">{t.booking.success}</h2>
              <p className="mt-2 text-muted-foreground">{t.booking.successDesc}</p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.step1}</span>
                    <span className="font-medium">
                      {selectedSportData?.icon} {t.sportNames[selectedSport as keyof typeof t.sportNames]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.step2}</span>
                    <span className="font-medium">{selectedCenterData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.step3}</span>
                    <span className="font-medium">
                      {format(selectedDate, "dd.MM.yyyy")} {selectedTime} ({selectedDuration}h)
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
                        <span>€{sportPrices[selectedSport] * selectedDuration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t.booking.equipmentCost}:</span>
                        <span>€{equipmentTotal}</span>
                      </div>
                      <div className="border-t border-border pt-1" />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.booking.price}</span>
                    <span className="font-bold text-foreground">
                      €{totalPrice}
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

        {/* Navigation */}
        {step >= 1 && step <= 4 && (
          <div className="mt-10 flex justify-between">
            <button
              onClick={() => {
                if (step === 1 && startMode) {
                  setStartMode(null);
                  setSelectedSport("");
                  setSelectedCenter("");
                } else if (step > 1) {
                  setStep(step - 1);
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all hover:bg-secondary active:scale-95"
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
                    : "cursor-not-allowed bg-secondary text-muted-foreground"
                )}
              >
                {t.booking.next}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled={!canProceed()}
                onClick={handleConfirm}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95",
                  canProceed()
                    ? "bg-sport-dark text-white hover:bg-sport-dark/90"
                    : "cursor-not-allowed bg-secondary text-muted-foreground"
                )}
              >
                <Check className="h-4 w-4" />
                {t.booking.confirm}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
