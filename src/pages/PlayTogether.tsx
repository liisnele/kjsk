import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { sports, sportCenters } from "@/data/mockData";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Users, MapPin, Calendar, Clock, Plus, ArrowRight, X, ChevronDown } from "lucide-react";

type SkillLevel = "beginner" | "intermediate" | "professional";

interface OpenGame {
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

const mockGames: OpenGame[] = [
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
    equipment: ["Pall / Ball"],
  },
  {
    id: "g3",
    sportId: "badminton",
    centerId: "wiru",
    courtId: "w5",
    date: "2026-03-25",
    time: "17:00",
    duration: 1,
    description: "Otsin paarismängu partnerit sulgpallis. Eelistan keskmisel tasemel mängijat.",
    level: "intermediate",
    minPlayers: 2,
    maxPlayers: 4,
    registeredPlayers: [{ name: "Igor R." }],
    creatorName: "Igor R.",
    equipment: ["Reketid / Rackets", "Sulid / Shuttlecocks"],
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
    equipment: ["Kepp / Stick", "Kiiver / Helmet", "Kaitsmed / Pads"],
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
    equipment: ["Reketid / Rackets", "Pallid / Balls"],
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
    equipment: ["Pall / Ball"],
  },
];

export default function PlayTogetherPage() {
  const { lang, t } = useLang();
  const [games, setGames] = useState<OpenGame[]>(mockGames);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [registerGameId, setRegisterGameId] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "" });
  const [hoveredProgressBar, setHoveredProgressBar] = useState<string | null>(null);
  const [myRegistrations, setMyRegistrations] = useState<{ [gameId: string]: string }>({});
  const [waitingList, setWaitingList] = useState<{ [gameId: string]: string[] }>({});
  const [myWaitingListEntries, setMyWaitingListEntries] = useState<{ [gameId: string]: string }>({});

  // Create form state
  const [createForm, setCreateForm] = useState({
    sportId: "",
    centerId: "",
    courtId: "",
    date: "",
    time: "",
    duration: 1,
    description: "",
    level: "intermediate" as SkillLevel,
    minPlayers: 2,
    maxPlayers: 10,
    creatorName: "",
    equipment: [] as string[],
  });

  // Helper function to check if game is within 24 hours
  const isWithin24Hours = (gameDate: string, gameTime: string): boolean => {
    const now = new Date();
    const gameDateTime = new Date(`${gameDate}T${gameTime}`);
    const hoursUntilGame = (gameDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilGame < 24 && hoursUntilGame > 0;
  };

  // Handle player cancellation - only for own registration
  const handleCancelRegistration = (gameId: string) => {
    const playerName = myRegistrations[gameId];
    if (!playerName) return;
    
    // Check if there's someone on the waitlist to promote
    const waitlistForGame = waitingList[gameId];
    let promotedPlayer: string | null = null;
    
    if (waitlistForGame && waitlistForGame.length > 0) {
      promotedPlayer = waitlistForGame[0];
    }
    
    // Update games and optionally promote from waitlist
    setGames(games.map((g) =>
      g.id === gameId
        ? { 
            ...g, 
            registeredPlayers: [
              ...g.registeredPlayers.filter((p) => p.name !== playerName),
              ...(promotedPlayer ? [{ name: promotedPlayer }] : [])
            ]
          }
        : g
    ));
    
    // Update waitlist if someone was promoted
    if (promotedPlayer && waitlistForGame) {
      const updatedWaitlist = waitlistForGame.slice(1);
      if (updatedWaitlist.length > 0) {
        setWaitingList({ ...waitingList, [gameId]: updatedWaitlist });
      } else {
        const newWaitingList = { ...waitingList };
        delete newWaitingList[gameId];
        setWaitingList(newWaitingList);
      }
    }
    
    // Remove from myRegistrations
    const updatedRegistrations = { ...myRegistrations };
    delete updatedRegistrations[gameId];
    setMyRegistrations(updatedRegistrations);
  };

  // Handle waiting list registration
  const handleWaitingListRegister = (gameId: string, playerName: string) => {
    const currentList = waitingList[gameId] || [];
    setWaitingList({ ...waitingList, [gameId]: [...currentList, playerName] });
    // Track this as my waitinglist entry
    setMyWaitingListEntries({ ...myWaitingListEntries, [gameId]: playerName });
  };

  // Handle waiting list cancellation
  const handleWaitingListCancel = (gameId: string, playerName?: string) => {
    if (playerName && waitingList[gameId]) {
      // Remove specific player from waitinglist
      const updatedList = waitingList[gameId].filter((p) => p !== playerName);
      if (updatedList.length > 0) {
        setWaitingList({ ...waitingList, [gameId]: updatedList });
      } else {
        const updatedWaitingList = { ...waitingList };
        delete updatedWaitingList[gameId];
        setWaitingList(updatedWaitingList);
      }
    } else {
      // Fall back to removing entire game entry
      const updatedWaitingList = { ...waitingList };
      delete updatedWaitingList[gameId];
      setWaitingList(updatedWaitingList);
    }
    // Remove from myWaitingListEntries
    const updatedMyList = { ...myWaitingListEntries };
    delete updatedMyList[gameId];
    setMyWaitingListEntries(updatedMyList);
  };

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

  const selectedSportForCreate = sports.find((s) => s.id === createForm.sportId);
  const centersForCreate = createForm.sportId
    ? sportCenters.filter((c) => c.sportIds.includes(createForm.sportId))
    : [];
  const selectedCenterForCreate = sportCenters.find((c) => c.id === createForm.centerId);
  const courtsForCreate = selectedCenterForCreate?.courts.filter(
    (c) => c.sportId === createForm.sportId
  ) || [];

  const handleCreateGame = () => {
    if (
      !createForm.sportId || !createForm.centerId || !createForm.courtId ||
      !createForm.date || !createForm.time || !createForm.creatorName || !createForm.description
    ) return;

    const newGame: OpenGame = {
      id: `g${Date.now()}`,
      sportId: createForm.sportId,
      centerId: createForm.centerId,
      courtId: createForm.courtId,
      date: createForm.date,
      time: createForm.time,
      duration: createForm.duration,
      description: createForm.description,
      level: createForm.level,
      minPlayers: createForm.minPlayers,
      maxPlayers: createForm.maxPlayers,
      registeredPlayers: [{ name: createForm.creatorName }],
      creatorName: createForm.creatorName,
      equipment: createForm.equipment,
    };

    // Also save as a booking in localStorage for the calendar
    const booking = {
      id: `b${Date.now()}`,
      sportId: createForm.sportId,
      centerId: createForm.centerId,
      date: createForm.date,
      time: createForm.time,
      duration: createForm.duration,
      name: createForm.creatorName,
      email: "",
      phone: "",
      participants: 1,
      status: "confirmed",
      courtId: createForm.courtId,
    };
    const existing = JSON.parse(localStorage.getItem("bookings") || "[]");
    localStorage.setItem("bookings", JSON.stringify([...existing, booking]));

    setGames([newGame, ...games]);
    setShowCreateForm(false);
    setCreateForm({
      sportId: "", centerId: "", courtId: "", date: "", time: "",
      duration: 1, description: "", level: "intermediate",
      minPlayers: 2, maxPlayers: 10, creatorName: "", equipment: [],
    });
  };

  const handleRegister = (gameId: string) => {
    if (!registerForm.name || !registerForm.email || !registerForm.phone) return;
    setGames(games.map((g) =>
      g.id === gameId
        ? { ...g, registeredPlayers: [...g.registeredPlayers, { name: registerForm.name }] }
        : g
    ));
    // Track this registration as "mine"
    setMyRegistrations({ ...myRegistrations, [gameId]: registerForm.name });
    setRegisterGameId(null);
    setRegisterForm({ name: "", email: "", phone: "" });
  };

  const inputCls = "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12">
        {/* Title + Create CTA */}
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

        {/* Create Game Form */}
        {showCreateForm && (
          <div className="mt-8 sport-card fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold">{t.playTogether.createGame}</h2>
              <button onClick={() => setShowCreateForm(false)} className="rounded-lg p-1.5 hover:bg-secondary active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Creator name */}
              <input
                placeholder={t.playTogether.yourName}
                value={createForm.creatorName}
                onChange={(e) => setCreateForm({ ...createForm, creatorName: e.target.value })}
                className={inputCls}
              />

              {/* Sport */}
              <div className="relative">
                <select
                  value={createForm.sportId}
                  onChange={(e) => setCreateForm({ ...createForm, sportId: e.target.value, centerId: "", courtId: "" })}
                  className={cn(inputCls, "appearance-none pr-10")}
                >
                  <option value="">{t.booking.selectSport}</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {t.sportNames[s.key as keyof typeof t.sportNames]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {/* Center */}
              <div className="relative">
                <select
                  value={createForm.centerId}
                  onChange={(e) => setCreateForm({ ...createForm, centerId: e.target.value, courtId: "" })}
                  disabled={!createForm.sportId}
                  className={cn(inputCls, "appearance-none pr-10 disabled:opacity-50")}
                >
                  <option value="">{t.booking.selectCenter}</option>
                  {centersForCreate.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {/* Court */}
              <div className="relative">
                <select
                  value={createForm.courtId}
                  onChange={(e) => setCreateForm({ ...createForm, courtId: e.target.value })}
                  disabled={!createForm.centerId}
                  className={cn(inputCls, "appearance-none pr-10 disabled:opacity-50")}
                >
                  <option value="">{t.playTogether.selectCourt}</option>
                  {courtsForCreate.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {/* Date */}
              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                className={inputCls}
              />

              {/* Time */}
              <input
                type="time"
                value={createForm.time}
                onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                className={inputCls}
              />

              {/* Duration */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.booking.timeBlock}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((h) => (
                    <button
                      key={h}
                      onClick={() => setCreateForm({ ...createForm, duration: h })}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95",
                        createForm.duration === h
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.playTogether.level}</label>
                <div className="flex gap-2">
                  {(["beginner", "intermediate", "professional"] as SkillLevel[]).map((lv) => (
                    <button
                      key={lv}
                      onClick={() => setCreateForm({ ...createForm, level: lv })}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95",
                        createForm.level === lv
                          ? "bg-sport-dark text-white"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {levelLabels[lv][lang]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min/Max players */}
              <input
                type="number"
                min={2}
                placeholder={t.playTogether.minPlayers}
                value={createForm.minPlayers}
                onChange={(e) => setCreateForm({ ...createForm, minPlayers: Number(e.target.value) })}
                className={inputCls}
              />
              <input
                type="number"
                min={2}
                placeholder={t.playTogether.maxPlayers}
                value={createForm.maxPlayers}
                onChange={(e) => setCreateForm({ ...createForm, maxPlayers: Number(e.target.value) })}
                className={inputCls}
              />

              {/* Equipment */}
              {selectedSportForCreate && selectedSportForCreate.equipmentOptions.length > 0 && (
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">{t.booking.equipment}</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSportForCreate.equipmentOptions.map((eq) => (
                      <button
                        key={eq}
                        onClick={() => {
                          const eqs = createForm.equipment.includes(eq)
                            ? createForm.equipment.filter((e) => e !== eq)
                            : [...createForm.equipment, eq];
                          setCreateForm({ ...createForm, equipment: eqs });
                        }}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                          createForm.equipment.includes(eq)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <textarea
                placeholder={t.playTogether.description}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3}
                className={cn(inputCls, "md:col-span-2 resize-none")}
              />
            </div>

            <button
              onClick={handleCreateGame}
              disabled={!createForm.sportId || !createForm.centerId || !createForm.courtId || !createForm.date || !createForm.time || !createForm.creatorName || !createForm.description}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.playTogether.publish}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Open Games List */}
        <div className="mt-10 flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">{t.playTogether.openGames}</h2>
          {games.map((game, idx) => {
            const sport = sports.find((s) => s.id === game.sportId);
            const center = sportCenters.find((c) => c.id === game.centerId);
            const court = center?.courts.find((c) => c.id === game.courtId);
            const isFull = game.registeredPlayers.length >= game.maxPlayers;

            return (
              <div
                key={game.id}
                className={cn("sport-card fade-in-up", `stagger-${Math.min(idx + 1, 5)}`)}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    {/* Sport + Level */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-2xl">{sport?.icon}</span>
                      <h3 className="font-display text-lg font-semibold">
                        {t.sportNames[game.sportId as keyof typeof t.sportNames]}
                      </h3>
                      <span className={cn("rounded-lg px-2.5 py-0.5 text-xs font-semibold", levelColors[game.level])}>
                        {levelLabels[game.level][lang]}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {game.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {game.time} ({game.duration}h)
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {center?.name} · {court?.name}
                      </span>
                      
                      {/* Player Registration Progress - Inline */}
                      <div className="w-full max-w-xs">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs font-medium text-foreground">{game.registeredPlayers.length}/{game.maxPlayers}</span>
                          <div 
                            className="relative flex-1 h-1.5 bg-secondary rounded-full overflow-visible group"
                            onMouseEnter={() => setHoveredProgressBar(game.id)}
                            onMouseLeave={() => setHoveredProgressBar(null)}
                          >
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(game.registeredPlayers.length / game.maxPlayers) * 100}%` }}
                            />
                            {/* Minimum threshold marker */}
                            <div 
                              className="absolute top-0 h-full w-0.5 bg-amber-500/60 hover:bg-amber-500/100 transition-colors cursor-help"
                              style={{ left: `${(game.minPlayers / game.maxPlayers) * 100}%` }}
                            />
                            
                            {/* Hover tooltip */}
                            {hoveredProgressBar === game.id && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                                Minimum: {game.minPlayers} players
                              </div>
                            )}
                          </div>
                          {/* Waitlist count badge for full games */}
                          {isFull && waitingList[game.id]?.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                              ⏳ {waitingList[game.id].length} {t.playTogether.waiting}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-pretty">{game.description}</p>

                    {/* Equipment */}
                    {game.equipment.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {game.equipment.map((eq) => (
                          <span key={eq} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Registered */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {game.registeredPlayers.map((p, i) => (
                        <span
                          key={i}
                          className="inline-flex h-7 items-center rounded-full bg-sport-yellow-light px-2.5 text-xs font-medium"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Register button */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {myRegistrations[game.id] ? (
                      // Show cancel button if user is registered (always, regardless of full status)
                      <button
                        onClick={() => {
                          const canCancel = !isWithin24Hours(game.date, game.time);
                          if (canCancel) {
                            handleCancelRegistration(game.id);
                          }
                        }}
                        disabled={isWithin24Hours(game.date, game.time)}
                        title={isWithin24Hours(game.date, game.time) ? "Cannot cancel within 24 hours of game" : "Cancel your registration"}
                        className={cn(
                          "rounded-2xl px-5 py-2.5 text-sm font-display font-semibold transition-all active:scale-[0.97]",
                          isWithin24Hours(game.date, game.time)
                            ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
                            : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                        )}
                      >
                        {t.playTogether.cancel}
                      </button>
                    ) : isFull ? (
                      myWaitingListEntries[game.id] ? (
                        // Show cancel waitinglist button if user is on waitinglist
                        <button
                          onClick={() => {
                            if (!isWithin24Hours(game.date, game.time)) {
                              handleWaitingListCancel(game.id, myWaitingListEntries[game.id]);
                            }
                          }}
                          disabled={isWithin24Hours(game.date, game.time)}
                          title={isWithin24Hours(game.date, game.time) ? "Cannot cancel waitlist within 24 hours of game" : "Cancel your waitlist entry"}
                          className={cn(
                            "rounded-2xl px-5 py-2.5 text-sm font-display font-semibold transition-all active:scale-[0.97]",
                            isWithin24Hours(game.date, game.time)
                              ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
                              : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                          )}
                        >
                          {t.playTogether.cancelWaitlist}
                        </button>
                      ) : (
                        // Show register to waitinglist button if user is not on waitinglist and not registered
                        <button
                          onClick={() => setRegisterGameId(registerGameId === game.id ? null : game.id)}
                          disabled={isWithin24Hours(game.date, game.time)}
                          title={isWithin24Hours(game.date, game.time) ? "Cannot join waitlist within 24 hours of game" : "Join the waitlist"}
                          className={cn(
                            "rounded-2xl border-2 px-5 py-2.5 text-sm font-display font-semibold transition-all active:scale-[0.97]",
                            isWithin24Hours(game.date, game.time)
                              ? "border-muted-foreground text-muted-foreground cursor-not-allowed opacity-60"
                              : "border-primary text-primary hover:bg-primary/10"
                          )}
                        >
                          {t.playTogether.joinWaitlist}
                        </button>
                      )
                    ) : (
                      // Show join button if user is not registered and game is not full
                      <button
                        onClick={() => setRegisterGameId(registerGameId === game.id ? null : game.id)}
                        className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97]"
                      >
                        {t.playTogether.join}
                      </button>
                    )}
                  </div>
                </div>

                {/* Register form inline */}
                {registerGameId === game.id && !myRegistrations[game.id] && (
                  <div className="mt-4 border-t border-border pt-4 fade-in-up">
                    <h4 className="mb-3 font-display text-sm font-semibold">
                      {isFull ? t.playTogether.registerWaitlist : t.playTogether.registerTitle}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        placeholder={t.playTogether.namePlaceholder}
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className={inputCls}
                      />
                      <input
                        type="email"
                        placeholder={t.booking.email}
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className={inputCls}
                      />
                      <input
                        placeholder={t.booking.phone}
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (isFull) {
                          handleWaitingListRegister(game.id, registerForm.name);
                          setRegisterGameId(null);
                          setRegisterForm({ name: "", email: "", phone: "" });
                        } else {
                          handleRegister(game.id);
                        }
                      }}
                      disabled={!registerForm.name || !registerForm.email || !registerForm.phone || (isFull && isWithin24Hours(game.date, game.time))}
                      title={isFull && isWithin24Hours(game.date, game.time) ? "Cannot join waitlist within 24 hours of game" : ""}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-sport-dark px-5 py-2.5 text-sm font-display font-semibold text-white transition-all hover:bg-sport-dark/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
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
