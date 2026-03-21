import { useLang } from "@/contexts/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const location = useLocation();

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors hover:text-foreground ${
      location.pathname === path ? "text-foreground" : "text-muted-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            K
          </div>
          <span className="hidden font-display text-lg font-semibold sm:block">
            KJ Sport
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className={linkClass("/")}>
            {t.nav.home}
          </Link>
          <Link to="/booking" className={linkClass("/booking")}>
            {t.nav.booking}
          </Link>
          <Link to="/play-together" className={linkClass("/play-together")}>
            {t.nav.playTogether}
          </Link>
        </nav>

        <button
          onClick={() => setLang(lang === "et" ? "en" : "et")}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-all hover:bg-secondary active:scale-95"
        >
          <Globe className="h-4 w-4" />
          {lang === "et" ? "EN" : "ET"}
        </button>
      </div>
    </header>
  );
}
