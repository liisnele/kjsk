import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  LogOut,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminBookingsQuery,
  useAdminMeQuery,
  useAdminSignInMutation,
  useAdminSignOutMutation,
  useCancelAdminBookingMutation,
  useCatalogQuery,
} from "@/hooks/use-api-data";
import { useLang } from "@/contexts/LanguageContext";
import { getTranslations, type Lang } from "@/data/translations";
import { cn } from "@/lib/utils";
import {
  arenaRowId,
  arenaSportIds,
  buildScheduleRows,
  getArenaLaneStyle,
  getArenaCapacity,
  getScheduleLeft,
  getScheduleWidth,
  getScheduleWidthPixels,
  scheduleHours,
  scheduleHourWidth,
  scheduleLabelWidth,
  scheduleTableWidth,
  scheduleTimelineWidth,
} from "@/lib/schedule";
import type { AdminBooking } from "@/types/api";

const formatDateTime = (booking: AdminBooking) =>
  `${booking.date.split("-").reverse().join(".")} ${booking.time}`;

const getLocalDateInputValue = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getStatusBadgeClass = (status: AdminBooking["status"]) =>
  status === "confirmed"
    ? "bg-emerald-500/15 text-emerald-200"
    : "bg-red-500/15 text-red-200";

const groupAdminBookings = (items: AdminBooking[]) => {
  const groups = new Map<string, AdminBooking>();

  for (const booking of items) {
    const groupId = booking.bookingGroupId ?? booking.id;
    const current = groups.get(groupId);

    if (!current || booking.id === groupId) {
      groups.set(groupId, booking);
    }
  }

  return Array.from(groups.values());
};

export default function AdminPage() {
  const { lang, setLang } = useLang();
  const adminLang: Lang = lang === "en" ? "en" : "et";
  const adminText = getTranslations(adminLang).admin;
  const nextAdminLang: Lang = adminLang === "en" ? "et" : "en";
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [activeView, setActiveView] = useState<"bookings" | "schedule">("bookings");
  const [filters, setFilters] = useState({ status: "confirmed", date: "", search: "" });
  const [selectedCenterId, setSelectedCenterId] = useState("all");
  const [scheduleDate, setScheduleDate] = useState(getLocalDateInputValue);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const meQuery = useAdminMeQuery();
  const catalogQuery = useCatalogQuery();
  const loginMutation = useAdminSignInMutation();
  const logoutMutation = useAdminSignOutMutation();
  const bookingsQuery = useAdminBookingsQuery(filters);
  const scheduleQuery = useAdminBookingsQuery({
    status: "confirmed",
    date: scheduleDate,
    search: "",
  });
  const cancelMutation = useCancelAdminBookingMutation();
  const centerOptions = catalogQuery.data?.sportCenters ?? [];
  const filterBySelectedCenter = (booking: AdminBooking) =>
    selectedCenterId === "all" || booking.centerId === selectedCenterId;
  const bookings = useMemo(
    () => groupAdminBookings(bookingsQuery.data ?? []).filter(filterBySelectedCenter),
    [bookingsQuery.data, selectedCenterId],
  );
  const scheduleBookings = useMemo(
    () => (scheduleQuery.data ?? []).filter(filterBySelectedCenter),
    [scheduleQuery.data, selectedCenterId],
  );
  const visibleBookings = activeView === "schedule" ? scheduleBookings : bookings;
  const selectedBooking = useMemo(
    () => visibleBookings.find((booking) => booking.id === selectedId) ?? visibleBookings[0],
    [selectedId, visibleBookings],
  );
  const arenaBookings = scheduleBookings.filter((booking) => arenaSportIds.has(booking.sportId));
  const scheduleRows = useMemo(() => {
    const centers =
      selectedCenterId === "all"
        ? centerOptions
        : centerOptions.filter((center) => center.id === selectedCenterId);
    const showCenterName = centers.length > 1;

    return centers.flatMap((center) =>
      buildScheduleRows(center, scheduleBookings, catalogQuery.data?.sports ?? []).map((row) => ({
        ...row,
        id: `${center.id}-${row.id}`,
        name: showCenterName ? `${center.name} · ${row.name}` : row.name,
      })),
    );
  }, [catalogQuery.data?.sports, centerOptions, scheduleBookings, selectedCenterId]);

  useEffect(() => {
    if (meQuery.data?.user) {
      bookingsQuery.refetch();
      scheduleQuery.refetch();
    }
  }, [filters, scheduleDate, meQuery.data?.user]);

  useEffect(() => {
    if (visibleBookings.length > 0 && !visibleBookings.some((booking) => booking.id === selectedId)) {
      setSelectedId(visibleBookings[0].id);
    }
  }, [selectedId, visibleBookings]);

  const onLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate(credentials, {
      onSuccess: () => {
        bookingsQuery.refetch();
        scheduleQuery.refetch();
      },
    });
  };

  const onCancelBooking = (booking: AdminBooking) => {
    cancelMutation.mutate(booking.id, {
      onSuccess: () => {
        bookingsQuery.refetch();
        scheduleQuery.refetch();
      },
    });
  };

  if (meQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-100">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!meQuery.data?.user) {
    return (
      <main className="min-h-screen bg-neutral-900 px-4 py-10 text-neutral-100">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
          <div className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-6 shadow-2xl shadow-black/30">
            <div className="mb-8 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
                  <img
                    src="/kj-vapp-must-mobile.svg"
                    alt="Logo"
                    className="h-11 w-11 object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-semibold">{adminText.appTitle}</h1>
                  <p className="text-sm text-neutral-300">{adminText.subtitle}</p>
                </div>
              </div>
              <button
                className="h-10 w-12 shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm font-semibold text-neutral-100 transition-colors hover:bg-neutral-800"
                onClick={() => setLang(nextAdminLang)}
                type="button"
              >
                {nextAdminLang.toUpperCase()}
              </button>
            </div>

            <form className="space-y-4" onSubmit={onLogin}>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  {adminText.username}
                </label>
                <Input
                  autoComplete="username"
                  className="border-neutral-700 bg-neutral-950 text-neutral-100"
                  value={credentials.username}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, username: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">
                  {adminText.password}
                </label>
                <Input
                  autoComplete="current-password"
                  className="border-neutral-700 bg-neutral-950 text-neutral-100"
                  type="password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </div>
              {loginMutation.isError ? (
                <p className="rounded-md border border-red-900/70 bg-red-950/50 px-3 py-2 text-sm text-red-200">
                  {adminText.loginFailed}
                </p>
              ) : null}
              <Button
                className="w-full"
                disabled={!credentials.username || !credentials.password || loginMutation.isPending}
                type="submit"
              >
                {adminText.login}
              </Button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <img
                src="/kj-vapp-must-mobile.svg"
                alt="Logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold">{adminText.appTitle}</h1>
              <p className="text-xs text-neutral-300">
                {meQuery.data.user.username} ·{" "}
                {meQuery.data.user.role === "senior_admin"
                  ? adminText.roleSeniorAdmin
                  : adminText.roleAdmin}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[48px_128px] items-center gap-2">
            <button
              className="h-10 w-12 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-sm font-semibold text-neutral-100 transition-colors hover:bg-neutral-800"
              onClick={() => setLang(nextAdminLang)}
              type="button"
            >
              {nextAdminLang.toUpperCase()}
            </button>
            <Button
              className="w-32 justify-center border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              variant="outline"
            >
              <LogOut className={cn("mr-2 h-4 w-4", logoutMutation.isPending && "animate-pulse")} />
              {adminText.logout}
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg border border-neutral-800 bg-neutral-950/60 p-1">
              <button
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-300 transition-colors",
                  activeView === "bookings" && "bg-primary text-primary-foreground",
                )}
                onClick={() => setActiveView("bookings")}
              >
                <Search className="h-4 w-4" />
                {adminText.bookings}
              </button>
              <button
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-300 transition-colors",
                  activeView === "schedule" && "bg-primary text-primary-foreground",
                )}
                onClick={() => setActiveView("schedule")}
              >
                <Clock3 className="h-4 w-4" />
                {adminText.schedule}
              </button>
            </div>
            <div className="relative sm:min-w-64">
              <select
                className="h-11 w-full appearance-none rounded-lg border border-neutral-800 bg-neutral-950/60 py-0 pl-3 pr-9 text-sm font-medium text-neutral-100 outline-none transition-colors hover:bg-neutral-900 focus:border-primary"
                value={selectedCenterId}
                onChange={(event) => setSelectedCenterId(event.target.value)}
              >
                <option value="all">{adminText.all}</option>
                {centerOptions.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-100" />
            </div>
          </div>

          {activeView === "bookings" ? (
            <>
              <div className="mb-5 flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
                  <Input
                    className="border-neutral-700 bg-neutral-950 pl-9 text-neutral-100"
                    placeholder={adminText.searchPlaceholder}
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, search: event.target.value }))
                    }
                  />
                </div>
                <div className="relative sm:w-44">
                  <Input
                    className="admin-date-input w-full border-neutral-700 bg-neutral-950 pr-10 text-neutral-100"
                    type="date"
                    value={filters.date}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-100" />
                </div>
                <div className="relative sm:w-44">
                  <select
                    className="h-10 w-full appearance-none rounded-md border border-neutral-700 bg-neutral-950 py-0 pl-3 pr-9 text-sm text-neutral-100"
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="confirmed">{adminText.confirmed}</option>
                    <option value="cancelled">{adminText.cancelled}</option>
                    <option value="all">{adminText.all}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-100" />
                </div>
                <Button
                  className="border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                  onClick={() => bookingsQuery.refetch()}
                  variant="outline"
                >
                  <RefreshCw
                    className={cn("mr-2 h-4 w-4", bookingsQuery.isFetching && "animate-spin")}
                  />
                  {adminText.refresh}
                </Button>
              </div>

              <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950/60">
                <div className="grid grid-cols-[130px_minmax(160px,1fr)_minmax(140px,1fr)_110px] border-b border-neutral-800 px-4 py-3 text-xs font-semibold uppercase text-neutral-300">
                  <span>{adminText.time}</span>
                  <span>{adminText.service}</span>
                  <span>{adminText.customer}</span>
                  <span>{adminText.status}</span>
                </div>
                <div className="divide-y divide-neutral-800">
                  {bookingsQuery.isFetching && bookings.length === 0 ? (
                    <div className="p-6 text-sm text-neutral-300">{adminText.loadingBookings}</div>
                  ) : bookings.length === 0 ? (
                    <div className="p-6 text-sm text-neutral-300">{adminText.noBookings}</div>
                  ) : (
                    bookings.map((booking) => (
                      <button
                        className={cn(
                          "grid w-full grid-cols-[130px_minmax(160px,1fr)_minmax(140px,1fr)_110px] gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-neutral-900",
                          selectedBooking?.id === booking.id && "bg-neutral-900",
                        )}
                        key={booking.id}
                        onClick={() => setSelectedId(booking.id)}
                      >
                        <span className="text-neutral-300">{formatDateTime(booking)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-neutral-100">
                            {booking.sportName}
                          </span>
                          <span className="block truncate text-xs text-neutral-400">
                            {booking.centerName}
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-neutral-200">{booking.name}</span>
                          <span className="block truncate text-xs text-neutral-400">{booking.email}</span>
                        </span>
                        <span>
                          <Badge className={cn(getStatusBadgeClass(booking.status))}>
                            {booking.status === "confirmed" ? adminText.confirmed : adminText.cancelled}
                          </Badge>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5 flex flex-col gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {adminText.daySchedule}
                </div>
                <div className="relative sm:ml-auto sm:w-44">
                  <Input
                    className="admin-date-input w-full border-neutral-700 bg-neutral-950 pr-10 text-neutral-100"
                    type="date"
                    value={scheduleDate}
                    onChange={(event) => setScheduleDate(event.target.value)}
                  />
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-100" />
                </div>
                <Button
                  className="border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                  onClick={() => scheduleQuery.refetch()}
                  variant="outline"
                >
                  <RefreshCw
                    className={cn("mr-2 h-4 w-4", scheduleQuery.isFetching && "animate-spin")}
                  />
                  {adminText.refresh}
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950/60">
                <div>
                  <div style={{ minWidth: scheduleTableWidth }}>
                    <div
                      className="sticky top-0 z-20 grid border-b border-neutral-800 bg-neutral-950 text-xs font-semibold uppercase text-neutral-300"
                      style={{
                        gridTemplateColumns: `${scheduleLabelWidth}px repeat(${scheduleHours.length}, ${scheduleHourWidth}px)`,
                      }}
                    >
                      <div className="sticky left-0 z-30 border-r border-neutral-800 bg-neutral-950 px-4 py-3">
                        {adminText.hallOrCourt}
                      </div>
                      {scheduleHours.map((hour) => (
                        <div
                          className="border-r border-neutral-800 px-2 py-3 text-center last:border-r-0"
                          key={hour}
                        >
                          {String(hour).padStart(2, "0")}:00
                        </div>
                      ))}
                    </div>

                    {catalogQuery.isLoading && scheduleRows.length <= 1 ? (
                      <div className="p-6 text-sm text-neutral-300">{adminText.loadingSchedule}</div>
                    ) : (
                    scheduleRows.map((row) => (
                      <div
                        className="grid border-b border-neutral-800 last:border-b-0"
                        key={row.id}
                        style={{
                          gridTemplateColumns: `${scheduleLabelWidth}px ${scheduleTimelineWidth}px`,
                        }}
                      >
                        <div className="sticky left-0 z-30 flex min-h-[64px] items-center border-r border-neutral-800 bg-neutral-950 px-4 text-sm font-medium text-neutral-200 shadow-[8px_0_14px_-12px_rgba(0,0,0,0.85)]">
                          {row.name}
                        </div>
                        <div className="relative min-h-[64px] bg-neutral-950">
                          <div
                            className="absolute inset-0 grid"
                            style={{
                              gridTemplateColumns: `repeat(${scheduleHours.length}, ${scheduleHourWidth}px)`,
                            }}
                          >
                            {scheduleHours.map((hour) => (
                              <div
                                className="border-r border-neutral-800/70 last:border-r-0"
                                key={hour}
                              />
                            ))}
                          </div>
                          {row.bookings.map((booking) => {
                            const isArena = row.id === arenaRowId || row.id.endsWith(`-${arenaRowId}`);
                            const sameCenterArenaBookings = arenaBookings.filter(
                              (item) => item.centerId === booking.centerId,
                            );
                            const compactBooking =
                              (isArena && getArenaCapacity(booking.sportId) <= 1) ||
                              getScheduleWidthPixels(booking) < 80;

                            return (
                              <button
                                className={cn(
                                  "absolute z-10 flex items-center overflow-hidden rounded-md border px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-lg transition-transform hover:scale-[1.01]",
                                  selectedBooking?.id === booking.id
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-neutral-700 bg-neutral-800 text-neutral-100",
                                )}
                                key={booking.id}
                                onClick={() => setSelectedId(booking.id)}
                                style={{
                                  left: getScheduleLeft(booking),
                                  width: getScheduleWidth(booking),
                                  ...(isArena
                                    ? getArenaLaneStyle(booking, sameCenterArenaBookings)
                                    : { top: "10%", height: "80%" }),
                                }}
                                title={`${booking.time} ${booking.name} - ${
                                  booking.resourceName || booking.sportName
                                }`}
                              >
                                {compactBooking ? (
                                  <span className="truncate">
                                    <span className="font-semibold">{booking.time}</span>{" "}
                                    {booking.name}
                                  </span>
                                ) : (
                                  <span className="min-w-0">
                                    <span className="block truncate font-semibold">
                                      {booking.time}
                                    </span>
                                    <span className="block truncate">{booking.name}</span>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-5">
          {selectedBooking ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-neutral-300">{adminText.booking}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{selectedBooking.name}</h2>
                </div>
                <Badge className={cn(getStatusBadgeClass(selectedBooking.status))}>
                  {selectedBooking.status === "confirmed" ? adminText.confirmed : adminText.cancelled}
                </Badge>
              </div>

              <dl className="grid gap-3 text-sm">
                {[
                  [adminText.id, selectedBooking.id],
                  [adminText.time, formatDateTime(selectedBooking)],
                  [adminText.service, selectedBooking.sportName],
                  [adminText.center, selectedBooking.centerName],
                  [adminText.courtRoom, selectedBooking.courtName || "-"],
                  [adminText.duration, `${selectedBooking.duration} min`],
                  [adminText.participants, String(selectedBooking.participants)],
                  [adminText.email, selectedBooking.email],
                  [adminText.phone, selectedBooking.phone],
                  [adminText.note, selectedBooking.note || "-"],
                  [adminText.equipment, selectedBooking.equipment.join(", ") || "-"],
                ].map(([label, value]) => (
                  <div className="rounded-md border border-neutral-800 bg-neutral-900/70 p-3" key={label}>
                    <dt className="text-xs uppercase text-neutral-300">{label}</dt>
                    <dd className="mt-1 break-words text-neutral-100">{value}</dd>
                  </div>
                ))}
              </dl>

              <Button
                className="w-full bg-red-600 text-white hover:bg-red-700"
                disabled={selectedBooking.status === "cancelled" || cancelMutation.isPending}
                onClick={() => onCancelBooking(selectedBooking)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {adminText.cancelBooking}
              </Button>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center text-center text-neutral-300">
              <CalendarDays className="mb-3 h-8 w-8" />
              <p>{adminText.selectBooking}</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

