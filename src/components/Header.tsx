import { useLang } from "@/contexts/LanguageContext";
import type { Lang } from "@/data/translations";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const languageOptions: Lang[] = ["et", "ru", "en"];
  const availableLanguages = languageOptions.filter((option) => option !== lang);

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors hover:text-foreground ${
      location.pathname === path ? "text-foreground" : "text-muted-foreground"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            {/* Mobile logo */}
            <img
              src="/kj-vapp-must-mobile.svg"
              alt="Logo"
              className="block h-11 w-11 object-contain sm:hidden"
            />

            {/* Desktop logo */}
            <img
              src="/kj-logo-must.svg"
              alt="Logo"
              className="hidden h-19 w-40 object-contain sm:block"
            />
          </div>
          <span className="hidden font-display text-lg font-semibold sm:block">

          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className={linkClass("/")}>
            {t.nav.home}
          </Link>
          <Link to="/booking" className={linkClass("/booking")}>
            {t.nav.booking}
          </Link>
          {/* Demo branch: Play Together is hidden for now. Restore this link to bring the tab back. */}
          {/* <Link to="/play-together" className={linkClass("/play-together") + " text-center"}>
            <span className="block whitespace-pre-line sm:inline">
              {t.nav.playTogether.split(" ").length === 2 ? (
                <>
                  <span>{t.nav.playTogether.split(" ")[0]}</span>
                  <span className="sm:hidden">
                    <br />
                  </span>
                  <span className="hidden sm:inline"> </span>
                  <span>{t.nav.playTogether.split(" ")[1]}</span>
                </>
              ) : (
                t.nav.playTogether
              )}
            </span>
          </Link> */}
        </nav>

        <div className="flex items-center gap-2">
          {availableLanguages.map((option) => (
            <button
              key={option}
              onClick={() => setLang(option)}
              className="min-w-11 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-secondary/80 active:scale-95"
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
