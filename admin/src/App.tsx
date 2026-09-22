import { useCallback, useEffect, useState } from "react";
import {
  deleteResponse, downloadCsv, fetchResponses, fetchStats, getPassword, setPassword as storePassword,
  UnauthorizedError, type Filters, type ResponseRow, type Stats,
} from "./api";
import { Login } from "./components/Login";
import { StatCards } from "./components/StatCards";
import { Charts } from "./components/Charts";
import { ResponsesTable } from "./components/ResponsesTable";
import { DetailPanel } from "./components/DetailPanel";

export default function App() {
  const [password, setPassword] = useState<string | null>(() => getPassword());
  const [loginError, setLoginError] = useState<string>();
  const [error, setError] = useState<string>();

  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const login = (t: string) => {
    storePassword(t);
    setLoginError(undefined);
    setPassword(t);
  };

  const logout = useCallback((message?: string) => {
    storePassword(null);
    setPassword(null);
    setStats(null);
    setRows([]);
    setSelectedId(null);
    setLoginError(message);
  }, []);

  // Un 401 renvoie à l'écran de connexion ; les autres erreurs s'affichent en bandeau.
  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) logout(err.message);
      else setError(err instanceof Error ? err.message : "Erreur inattendue");
    },
    [logout],
  );

  const loadStats = useCallback(() => {
    if (password) fetchStats(password).then(setStats, handleError);
  }, [password, handleError]);

  // Recharge la première page à chaque changement de filtres.
  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    setLoading(true);
    fetchResponses(password, filters)
      .then((page) => {
        if (cancelled) return;
        setRows(page.items);
        setCursor(page.nextCursor);
      }, handleError)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [password, filters, handleError]);

  useEffect(loadStats, [loadStats]);

  const loadMore = () => {
    if (!password || !cursor) return;
    setLoading(true);
    fetchResponses(password, filters, cursor)
      .then((page) => {
        setRows((prev) => [...prev, ...page.items]);
        setCursor(page.nextCursor);
      }, handleError)
      .finally(() => setLoading(false));
  };

  const remove = async (id: string) => {
    if (!password) return;
    try {
      await deleteResponse(password, id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSelectedId(null);
      loadStats();
    } catch (err) {
      handleError(err);
    }
  };

  const closeDetail = useCallback(() => setSelectedId(null), []);

  if (!password) return <Login onSubmit={login} error={loginError} />;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Enquête mobilité N'Djamena</h1>
          <p>Tableau de bord interne</p>
        </div>
        <div className="topbar-actions">
          <button className="btn on-dark" onClick={() => { setError(undefined); loadStats(); setFilters({ ...filters }); }}>
            Actualiser
          </button>
          <button className="btn on-dark" onClick={() => logout()}>Se déconnecter</button>
        </div>
      </header>

      <main className="content">
        {error && (
          <div className="banner" role="alert">
            {error}
            <button className="btn ghost" onClick={() => setError(undefined)} aria-label="Fermer">✕</button>
          </div>
        )}

        {stats ? (
          <>
            <StatCards stats={stats} />
            <Charts stats={stats} />
          </>
        ) : (
          <p className="muted">Chargement des statistiques…</p>
        )}

        <ResponsesTable
          rows={rows}
          filters={filters}
          vehicleTypes={stats?.vehicleTypes.map((v) => v.label).filter((l) => l !== "Non renseigné") ?? []}
          loading={loading}
          hasMore={!!cursor}
          selectedId={selectedId}
          onFilters={setFilters}
          onMore={loadMore}
          onSelect={setSelectedId}
          onExport={() => downloadCsv(password, filters).catch(handleError)}
        />
      </main>

      {selectedId && (
        <>
          <div className="backdrop" onClick={closeDetail} />
          <DetailPanel id={selectedId} password={password} onClose={closeDetail} onDelete={remove} onError={handleError} />
        </>
      )}
    </div>
  );
}
