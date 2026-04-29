import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { useLang } from "@/contexts/LanguageContext";
import {
  useBookingsQuery,
  useCancelGameRegistrationMutation,
  useCancelWaitlistEntryMutation,
  useCatalogQuery,
  useCreateGameMutation,
  useGamesQuery,
  useRegisterForGameMutation,
} from "@/hooks/use-api-data";
import {
  getAvailableTimesWithMinDuration,
  isDurationAvailable,
} from "@/lib/availability";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@/types/api";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  Plus,
  Users,
  X,
} from "lucide-react";

const levelLabels: Record<SkillLevel, { et: string; en: string }> = {
  beginner: { et: "Algaja", en: "Beginner" },
  intermediate: { et: "Keskmine", en: "Intermediate" },
  professional: { et: "Edasijõudnud", en: "Professional" },
};

const levelColors: Record<SkillLevel, string> = {
  beginner: "bg-sport-success/10 text-sport-success",
  intermediate: "bg-primary/15 text-primary-foreground",
  professional: "bg-destructive/10 text-destructive",
};

export default function PlayTogetherPage() {
  const { lang, t } = useLang();
  const { data: catalog, isLoading: catalogLoading } = useCatalogQuery();
  const { data: games = [], isLoading: gamesLoading } = useGamesQuery();
  const { data: bookings = [] } = useBookingsQuery();
  const createGameMutation = useCreateGameMutation();
  const registerMutation = useRegisterForGameMutation();
  const cancelRegistrationMutation = useCancelGameRegistrationMutation();
  const cancelWaitlistMutation = useCancelWaitlistEntryMutation();

  const sports = catalog?.sports ?? [];
  const sportCenters = catalog?.sportCenters ?? [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [registerGameId, setRegisterGameId] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "" });
  const [myRegistrations, setMyRegistrations] = useState<Record<string, string>>({});
  const [myWaitingListEntries, setMyWaitingListEntries] = useState<Record<string, string>>({});
  const [hoveredProgressBar, setHoveredProgressBar] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    creatorName: "",
    sportId: "",
    centerId: "",
    courtId: "",
    date: "",
    time: "",
    duration: 1,
    description: "",
    level: "intermediate" as SkillLevel,
    minPlayers: "" as string | number,
    maxPlayers: "" as string | number,
    equipment: [] as string[],
  });

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  const centersForCreate = createForm.sportId
    ? sportCenters.filter((center) => center.sportIds.includes(createForm.sportId))
    : [];
  const selectedCenterForCreate = sportCenters.find((center) => center.id === createForm.centerId);
  const selectedSportForCreate = sports.find((sport) => sport.id === createForm.sportId);
  const courtsForCreate =
    selectedCenterForCreate?.courts.filter((court) => court.sportId === createForm.sportId) ?? [];

  const availableTimes = useMemo(() => {
    if (!createForm.date || !createForm.centerId || !createForm.sportId) return [];
    return getAvailableTimesWithMinDuration(
      createForm.date,
      createForm.centerId,
      createForm.sportId,
      1,
      sportCenters,
      bookings,
    );
  }, [bookings, createForm.centerId, createForm.date, createForm.sportId, sportCenters]);

  const isWithin24Hours = (gameDate: string, gameTime: string) => {
    const now = new Date();
    const gameDateTime = new Date(`${gameDate}T${gameTime}`);
    const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilGame < 24 && hoursUntilGame > 0;
  };

  const handleCreateGame = async () => {
    const minPlayers = Math.max(2, createForm.minPlayers === "" ? 2 : Number(createForm.minPlayers));
    const maxPlayers = createForm.maxPlayers === "" ? 10 : Number(createForm.maxPlayers);

    if (
      !createForm.creatorName ||
      !createForm.sportId ||
      !createForm.centerId ||
      !createForm.courtId ||
      !createForm.date ||
      !createForm.time ||
      !createForm.description ||
      maxPlayers < minPlayers
    ) {
      return;
    }

    await createGameMutation.mutateAsync({
      creatorName: createForm.creatorName,
      sportId: createForm.sportId,
      centerId: createForm.centerId,
      courtId: createForm.courtId,
      date: createForm.date,
      time: createForm.time,
      duration: createForm.duration,
      description: createForm.description,
      level: createForm.level,
      minPlayers,
      maxPlayers,
      equipment: createForm.equipment,
    });

    setShowCreateForm(false);
    setCreateForm({
      creatorName: "",
      sportId: "",
      centerId: "",
      courtId: "",
      date: "",
      time: "",
      duration: 1,
      description: "",
      level: "intermediate",
      minPlayers: "",
      maxPlayers: "",
      equipment: [],
    });
  };

  const handleRegister = async (gameId: string, isFull: boolean) => {
    if (!registerForm.name || !registerForm.email || !registerForm.phone) return;

    await registerMutation.mutateAsync({
      gameId,
      payload: registerForm,
    });

    if (isFull) {
      setMyWaitingListEntries({ ...myWaitingListEntries, [gameId]: registerForm.name });
    } else {
      setMyRegistrations({ ...myRegistrations, [gameId]: registerForm.name });
    }

    setRegisterGameId(null);
    setRegisterForm({ name: "", email: "", phone: "" });
  };

  const loading = catalogLoading || gamesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t.playTogether.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.playTogether.subtitle}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            {t.playTogether.createGame}
          </button>
        </div>

        {loading && <p className="mt-8 text-muted-foreground">Loading games...</p>}

        {showCreateForm && (
          <div className="mt-8 sport-card fade-in-up">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{t.playTogether.createGame}</h2>
              <button onClick={() => setShowCreateForm(false)} className="rounded-lg p-1.5 hover:bg-secondary active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                placeholder={t.playTogether.yourName}
                value={createForm.creatorName}
                onChange={(event) => setCreateForm({ ...createForm, creatorName: event.target.value })}
                className={inputCls}
              />

              <div className="relative">
                <select
                  value={createForm.sportId}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      sportId: event.target.value,
                      centerId: "",
                      courtId: "",
                      time: "",
                    })
                  }
                  className={cn(inputCls, "appearance-none pr-10")}
                >
                  <option value="">{t.booking.selectSport}</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.icon} {t.sportNames[sport.key as keyof typeof t.sportNames]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div className="relative">
                <select
                  value={createForm.centerId}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, centerId: event.target.value, courtId: "", time: "" })
                  }
                  disabled={!createForm.sportId}
                  className={cn(inputCls, "appearance-none pr-10 disabled:opacity-50")}
                >
                  <option value="">{t.booking.selectCenter}</option>
                  {centersForCreate.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div className="relative">
                <select
                  value={createForm.courtId}
                  onChange={(event) => setCreateForm({ ...createForm, courtId: event.target.value, time: "" })}
                  disabled={!createForm.centerId}
                  className={cn(inputCls, "appearance-none pr-10 disabled:opacity-50")}
                >
                  <option value="">{t.playTogether.selectCourt}</option>
                  {courtsForCreate.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <input
                type="date"
                value={createForm.date}
                onChange={(event) => setCreateForm({ ...createForm, date: event.target.value })}
                className={inputCls}
              />

              <div className="relative">
                <select
                  value={createForm.time}
                  onChange={(event) => setCreateForm({ ...createForm, time: event.target.value })}
                  disabled={!createForm.date || !createForm.courtId}
                  className={cn(inputCls, "appearance-none pr-10 disabled:opacity-50")}
                >
                  <option value="">{t.booking.selectTime || "Select time"}</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.booking.timeBlock}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4]
                    .filter(
                      (duration) =>
                        !createForm.time ||
                        !createForm.courtId ||
                        !createForm.date ||
                        !createForm.centerId ||
                        isDurationAvailable(
                          createForm.date,
                          createForm.time,
                          duration,
                          createForm.centerId,
                          createForm.courtId,
                          bookings,
                        ),
                    )
                    .map((hours) => (
                      <button
                        key={hours}
                        onClick={() => setCreateForm({ ...createForm, duration: hours })}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95",
                          createForm.duration === hours
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-secondary/80",
                        )}
                      >
                        {hours}h
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.playTogether.level}</label>
                <div className="flex gap-2">
                  {(["beginner", "intermediate", "professional"] as SkillLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setCreateForm({ ...createForm, level })}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95",
                        createForm.level === level
                          ? "bg-sport-dark text-white"
                          : "bg-secondary text-foreground hover:bg-secondary/80",
                      )}
                    >
                      {levelLabels[level][lang]}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                min={2}
                max={26}
                placeholder={t.playTogether.minPlayersPlaceholder}
                value={createForm.minPlayers}
                onChange={(event) => setCreateForm({ ...createForm, minPlayers: event.target.value })}
                className={inputCls}
              />

              <input
                type="number"
                max={30}
                placeholder={t.playTogether.maxPlayersPlaceholder}
                value={createForm.maxPlayers}
                onChange={(event) => setCreateForm({ ...createForm, maxPlayers: event.target.value })}
                className={inputCls}
              />

              {selectedSportForCreate && selectedSportForCreate.equipmentOptions.length > 0 && (
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">{t.booking.equipment}</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSportForCreate.equipmentOptions.map((equipmentId) => (
                      <button
                        key={equipmentId}
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            equipment: createForm.equipment.includes(equipmentId)
                              ? createForm.equipment.filter((item) => item !== equipmentId)
                              : [...createForm.equipment, equipmentId],
                          })
                        }
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                          createForm.equipment.includes(equipmentId)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80",
                        )}
                      >
                        {t.equipmentNames[equipmentId as keyof typeof t.equipmentNames]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <textarea
                  placeholder={t.playTogether.description}
                  value={createForm.description}
                  onChange={(event) => setCreateForm({ ...createForm, description: event.target.value.slice(0, 1000) })}
                  maxLength={1000}
                  rows={3}
                  className={cn(inputCls, "resize-none w-full break-words whitespace-pre-wrap overflow-hidden")}
                />
                <div className="mt-1 text-xs text-muted-foreground">{createForm.description.length}/1000</div>
              </div>
            </div>

            <button
              onClick={() => void handleCreateGame()}
              disabled={createGameMutation.isPending}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createGameMutation.isPending ? "Publishing..." : t.playTogether.publish}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">{t.playTogether.openGames}</h2>
          {games.map((game, index) => {
            const sport = sports.find((item) => item.id === game.sportId);
            const center = sportCenters.find((item) => item.id === game.centerId);
            const court = center?.courts.find((item) => item.id === game.courtId);
            const isFull = game.registeredPlayers.length >= game.maxPlayers;
            const myRegistrationName = myRegistrations[game.id];
            const myWaitlistName = myWaitingListEntries[game.id];

            return (
              <div key={game.id} className={cn("sport-card fade-in-up", `stagger-${Math.min(index + 1, 5)}`)}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-2xl">{sport?.icon}</span>
                      <h3 className="font-display text-lg font-semibold">
                        {sport ? t.sportNames[sport.key as keyof typeof t.sportNames] : game.sportId}
                      </h3>
                      <span className={cn("rounded-lg px-2.5 py-0.5 text-xs font-semibold", levelColors[game.level])}>
                        {levelLabels[game.level][lang]}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{game.date}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{game.time} ({game.duration}h)</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{center?.name} · {court?.name}</span>
                      <div className="w-full max-w-xs">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-medium text-foreground">{game.registeredPlayers.length}/{game.maxPlayers}</span>
                          <div
                            className="group relative h-1.5 flex-1 overflow-visible rounded-full bg-secondary"
                            onMouseEnter={() => setHoveredProgressBar(game.id)}
                            onMouseLeave={() => setHoveredProgressBar(null)}
                          >
                            <div className="h-full bg-primary transition-all" style={{ width: `${(game.registeredPlayers.length / game.maxPlayers) * 100}%` }} />
                            <div className="absolute top-0 h-full w-0.5 bg-amber-500/60" style={{ left: `${(game.minPlayers / game.maxPlayers) * 100}%` }} />
                            {hoveredProgressBar === game.id && (
                              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background">
                                Minimum: {game.minPlayers} players
                              </div>
                            )}
                          </div>
                          {isFull && game.waitingList.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              ⏳ {game.waitingList.length} {t.playTogether.waiting}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 max-w-full w-full break-words whitespace-pre-wrap text-sm text-pretty overflow-hidden">
                      {game.description}
                    </p>

                    {game.equipment.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {game.equipment.map((equipmentId) => (
                          <span key={equipmentId} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            {t.equipmentNames[equipmentId as keyof typeof t.equipmentNames] || equipmentId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {myRegistrationName ? (
                      <button
                        onClick={() => {
                          if (!isWithin24Hours(game.date, game.time)) {
                            void cancelRegistrationMutation.mutateAsync({ gameId: game.id, name: myRegistrationName });
                            const next = { ...myRegistrations };
                            delete next[game.id];
                            setMyRegistrations(next);
                          }
                        }}
                        disabled={isWithin24Hours(game.date, game.time)}
                        className={cn(
                          "rounded-2xl px-5 py-2.5 text-sm font-display font-semibold transition-all active:scale-[0.97]",
                          isWithin24Hours(game.date, game.time)
                            ? "cursor-not-allowed bg-secondary text-muted-foreground opacity-60"
                            : "bg-destructive/20 text-destructive hover:bg-destructive/30",
                        )}
                      >
                        {t.playTogether.cancel}
                      </button>
                    ) : isFull ? (
                      myWaitlistName ? (
                        <button
                          onClick={() => {
                            if (!isWithin24Hours(game.date, game.time)) {
                              void cancelWaitlistMutation.mutateAsync({ gameId: game.id, name: myWaitlistName });
                              const next = { ...myWaitingListEntries };
                              delete next[game.id];
                              setMyWaitingListEntries(next);
                            }
                          }}
                          disabled={isWithin24Hours(game.date, game.time)}
                          className={cn(
                            "rounded-2xl px-5 py-2.5 text-sm font-display font-semibold transition-all active:scale-[0.97]",
                            isWithin24Hours(game.date, game.time)
                              ? "cursor-not-allowed bg-secondary text-muted-foreground opacity-60"
                              : "bg-destructive/20 text-destructive hover:bg-destructive/30",
                          )}
                        >
                          {t.playTogether.cancelWaitlist}
                        </button>
                      ) : (
                        <button
                          onClick={() => setRegisterGameId(registerGameId === game.id ? null : game.id)}
                          disabled={isWithin24Hours(game.date, game.time)}
                          className={cn(
                            "rounded-2xl border-2 px-5 py-2.5 text-sm font-display font-semibold transition-all active:scale-[0.97]",
                            isWithin24Hours(game.date, game.time)
                              ? "border-muted-foreground text-muted-foreground cursor-not-allowed opacity-60"
                              : "border-primary text-primary hover:bg-primary/10",
                          )}
                        >
                          {t.playTogether.joinWaitlist}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => setRegisterGameId(registerGameId === game.id ? null : game.id)}
                        className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97]"
                      >
                        {t.playTogether.join}
                      </button>
                    )}
                  </div>
                </div>

                {registerGameId === game.id && !myRegistrationName && (
                  <div className="mt-4 border-t border-border pt-4 fade-in-up">
                    <h4 className="mb-3 font-display text-sm font-semibold">
                      {isFull ? t.playTogether.registerWaitlist : t.playTogether.registerTitle}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        placeholder={t.playTogether.namePlaceholder}
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                        className={inputCls}
                      />
                      <input
                        type="email"
                        placeholder={t.booking.email}
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                        className={inputCls}
                      />
                      <input
                        placeholder={t.booking.phone}
                        value={registerForm.phone}
                        onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <button
                      onClick={() => void handleRegister(game.id, isFull)}
                      disabled={!registerForm.name || !registerForm.email || !registerForm.phone || registerMutation.isPending}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-sport-dark px-5 py-2.5 text-sm font-display font-semibold text-white transition-all hover:bg-sport-dark/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isFull ? t.playTogether.confirmWaitlist : t.playTogether.confirmJoin}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
