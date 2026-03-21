import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { Booking, sports, sportCenters } from "@/data/mockData";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Calendar, X, ArrowRight } from "lucide-react";

export default function MyBookingsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bookings") || "[]");
    setBookings(stored);
  }, []);

  const cancelBooking = (id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "cancelled" as const } : b
    );
    setBookings(updated);
    localStorage.setItem("bookings", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12">
        <h1 className="font-display text-3xl font-bold">{t.myBookings.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.myBookings.upcoming}</p>

        {bookings.length === 0 ? (
          <div className="mt-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">{t.myBookings.noBookings}</p>
            <button
              onClick={() => navigate("/booking")}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.97]"
            >
              {t.myBookings.bookNow}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {bookings.map((booking) => {
              const sport = sports.find((s) => s.id === booking.sportId);
              const center = sportCenters.find((c) => c.id === booking.centerId);
              return (
                <div
                  key={booking.id}
                  className={cn(
                    "sport-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                    booking.status === "cancelled" && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{sport?.icon}</span>
                    <div>
                      <h3 className="font-display font-semibold">
                        {t.sportNames[booking.sportId as keyof typeof t.sportNames]}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {center?.name} · {booking.date} · {booking.time} ({booking.duration}h)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-lg px-3 py-1 text-xs font-semibold",
                        booking.status === "confirmed"
                          ? "bg-sport-success/10 text-sport-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {booking.status === "confirmed" ? t.myBookings.confirmed : t.myBookings.cancelled}
                    </span>
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 active:scale-95"
                      >
                        <X className="h-3 w-3" />
                        {t.myBookings.cancel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
