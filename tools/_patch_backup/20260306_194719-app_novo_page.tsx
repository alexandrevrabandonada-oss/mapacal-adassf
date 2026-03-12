"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SectionCard } from "@/components/section-card";
import { SiteShell } from "@/components/site-shell";
import {
  getConditionLabel,
  getTagLabel,
  SIDEWALK_CONDITIONS,
  SIDEWALK_TAGS,
  type SidewalkCondition
} from "@/lib/domain/sidewalk";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type AuthState = "loading" | "authenticated" | "anonymous";

type NearbyItem = Database["public"]["Functions"]["nearby_sidewalk_reports"]["Returns"][number];

type NearbyApiResponse = {
  ok: boolean;
  reports: NearbyItem[];
  message?: string;
  reason?: string;
};

type CreateApiResponse = {
  ok: boolean;
  message: string;
  reportId?: string;
};

const HOW_IT_WORKS = [
  "Registrar: voce descreve o problema e o ponto da cidade.",
  "Revisar: o registro entra em fila de moderacao.",
  "Publicar: pontos validados aparecem para consulta publica.",
  "Confirmar em comunidade: outras pessoas reforcam prioridade."
];

export default function NovoPage() {
  const envReady = useMemo(() => isSupabaseConfigured(), []);
  const [authState, setAuthState] = useState<AuthState>(envReady ? "loading" : "anonymous");
  const [condition, setCondition] = useState<SidewalkCondition>("bad");
  const [neighborhood, setNeighborhood] = useState("");
  const [note, setNote] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [locationSource, setLocationSource] = useState<"manual" | "gps">("manual");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [nearbyMessage, setNearbyMessage] = useState<string>("");
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string>("");

  useEffect(() => {
    if (!envReady) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthState("anonymous");
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) {
        return;
      }
      if (error || !data.user) {
        setAuthState("anonymous");
        return;
      }
      setAuthState("authenticated");
    });

    return () => {
      mounted = false;
    };
  }, [envReady]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Seu navegador nao oferece geolocalizacao. Preencha latitude e longitude manualmente.");
      return;
    }

    setLocationMessage("Buscando sua localizacao...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        if (Number.isFinite(position.coords.accuracy)) {
          setAccuracy(position.coords.accuracy.toFixed(0));
        }
        setLocationSource("gps");
        setLocationMessage("Localizacao preenchida com GPS.");
      },
      () => {
        setLocationMessage("Nao foi possivel usar GPS agora. Continue em modo manual.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  async function handleNearbySearch() {
    const latNumber = Number(lat);
    const lngNumber = Number(lng);

    if (!Number.isFinite(latNumber) || !Number.isFinite(lngNumber)) {
      setNearbyItems([]);
      setNearbyMessage("Informe latitude e longitude validas para buscar pontos proximos.");
      return;
    }

    setLoadingNearby(true);
    setNearbyMessage("");

    try {
      const response = await fetch("/api/reports/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latNumber, lng: lngNumber, meters: 25 })
      });

      const payload = (await response.json()) as NearbyApiResponse;
      setNearbyItems(payload.reports ?? []);

      if (payload.message) {
        setNearbyMessage(payload.message);
      } else if ((payload.reports ?? []).length === 0) {
        setNearbyMessage("Nenhum ponto publicado encontrado neste raio.");
      } else {
        setNearbyMessage("Ja existe ponto perto daqui. Antes de criar outro, confira se um deles ja representa o problema.");
      }
    } catch {
      setNearbyItems([]);
      setNearbyMessage("Falha de rede ao consultar dedupe. Tente novamente.");
    } finally {
      setLoadingNearby(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");
    setSubmitError("");

    if (authState !== "authenticated") {
      setSubmitError("Faca login para enviar um registro.");
      return;
    }

    const latNumber = Number(lat);
    const lngNumber = Number(lng);

    if (!condition || !Number.isFinite(latNumber) || !Number.isFinite(lngNumber)) {
      setSubmitError("Condicao, latitude e longitude sao obrigatorias.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition,
          lat: latNumber,
          lng: lngNumber,
          neighborhood,
          note,
          accuracy_m: accuracy ? Number(accuracy) : undefined,
          tags: selectedTags
        })
      });

      const payload = (await response.json()) as CreateApiResponse;

      if (!response.ok || !payload.ok) {
        setSubmitError(payload.message || "Nao foi possivel enviar o registro.");
        return;
      }

      setSubmitMessage(payload.message || "Registro enviado para moderacao");
      setNeighborhood("");
      setNote("");
      setSelectedTags([]);
      setNearbyItems([]);
      setNearbyMessage("");
    } catch {
      setSubmitError("Falha de rede ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell
      title="Novo registro"
      subtitle="Envie um ponto com localizacao, condicao e contexto. Foto entra no proximo tijolo para manter este fluxo textual estavel e auditavel."
    >
      <SectionCard title="Status do fluxo" eyebrow="T03 ativo">
        <ul className="space-y-2">
          <li>- Fluxo de registro: ativo.</li>
          <li>- Foto: entra no proximo tijolo.</li>
          <li>- Publicacao: depende de moderacao.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Como funciona" eyebrow="Etapas publicas">
        <ol className="space-y-2">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step}>
              <span className="mr-2 inline-block border-2 border-[var(--ink)] bg-[var(--signal)] px-2 py-0.5 text-xs font-black">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      {!envReady ? (
        <SectionCard title="Supabase nao configurado" eyebrow="Setup necessario">
          <p>Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY para ativar o envio.</p>
          <p className="mt-2">Sem configuracao, a pagina continua estavel e nao tenta gravar no banco.</p>
          <Link
            href="/login"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Ir para login
          </Link>
        </SectionCard>
      ) : null}

      {envReady && authState === "loading" ? (
        <SectionCard title="Verificando sessao" eyebrow="Auth">
          <p>Conferindo se voce esta autenticado...</p>
        </SectionCard>
      ) : null}

      {envReady && authState === "anonymous" ? (
        <SectionCard title="Login necessario" eyebrow="Acesso">
          <p>Para criar um registro real, entre com magic link.</p>
          <Link
            href="/login"
            className="mt-3 inline-block border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
          >
            Fazer login
          </Link>
        </SectionCard>
      ) : null}

      {envReady && authState === "authenticated" ? (
        <SectionCard title="Formulario de registro" eyebrow="Dados reais">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset>
              <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em]">Condicao da calcada</legend>
              <div className="grid gap-2 md:grid-cols-3">
                {SIDEWALK_CONDITIONS.map((item) => (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-2 border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2"
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={item}
                      checked={condition === item}
                      onChange={() => setCondition(item)}
                    />
                    <span>{getConditionLabel(item)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Bairro</span>
              <input
                type="text"
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                className="w-full border-2 border-[var(--ink)] bg-white px-3 py-2"
                placeholder="Ex: Centro"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Nota (opcional)</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-24 w-full border-2 border-[var(--ink)] bg-white px-3 py-2"
                placeholder="Descreva o contexto rapidamente"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em]">Tags (opcional)</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {SIDEWALK_TAGS.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 border border-[var(--ink)] bg-white px-2 py-1">
                    <input
                      type="checkbox"
                      value={tag}
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    <span>{getTagLabel(tag)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(event) => {
                    setLat(event.target.value);
                    setLocationSource("manual");
                  }}
                  className="w-full border-2 border-[var(--ink)] bg-white px-3 py-2"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(event) => {
                    setLng(event.target.value);
                    setLocationSource("manual");
                  }}
                  className="w-full border-2 border-[var(--ink)] bg-white px-3 py-2"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em]">Accuracy (m)</span>
                <input
                  type="number"
                  step="any"
                  value={accuracy}
                  readOnly={locationSource === "gps"}
                  onChange={(event) => setAccuracy(event.target.value)}
                  className="w-full border-2 border-[var(--ink)] bg-white px-3 py-2"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)]"
              >
                Usar minha localizacao
              </button>
              <button
                type="button"
                onClick={handleNearbySearch}
                disabled={loadingNearby}
                className="border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--signal)] disabled:opacity-60"
              >
                {loadingNearby ? "Buscando..." : "Buscar pontos proximos"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="border-2 border-[var(--ink)] bg-[var(--signal)] px-3 py-2 text-xs font-black uppercase hover:bg-white disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar registro"}
              </button>
            </div>

            {locationMessage ? <p className="text-xs text-zinc-700">{locationMessage}</p> : null}
            {nearbyMessage ? <p className="text-xs text-zinc-700">{nearbyMessage}</p> : null}

            {nearbyItems.length > 0 ? (
              <div className="space-y-2 border-2 border-[var(--ink)] bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em]">
                  Pontos proximos encontrados (raio de 25m). Antes de criar um novo, considere confirmar um existente.
                </p>
                <ul className="space-y-2 text-sm">
                  {nearbyItems.map((item) => (
                    <li key={item.id} className="border border-zinc-300 p-2">
                      <p>
                        <span className="font-semibold">Condicao:</span> {getConditionLabel(item.condition as SidewalkCondition)}
                      </p>
                      <p>
                        <span className="font-semibold">Bairro:</span> {item.neighborhood || "Nao informado"}
                      </p>
                      <p>
                        <span className="font-semibold">Distancia:</span> {Math.round(item.distance_m)} m
                      </p>
                      <p>
                        <span className="font-semibold">Data:</span> {new Date(item.created_at).toLocaleString("pt-BR")}
                      </p>
                      <div className="mt-2">
                        <Link
                          href={`/r/${item.id}`}
                          className="inline-block border border-[var(--ink)] bg-[var(--signal)] px-2 py-1 text-xs font-bold uppercase hover:bg-[var(--paper)]"
                        >
                          Ver detalhes e confirmar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {submitError ? <p className="text-sm font-semibold text-red-700">{submitError}</p> : null}
            {submitMessage ? (
              <div className="space-y-2 border-2 border-[var(--ink)] bg-[var(--signal)] p-3">
                <p className="text-sm font-bold">{submitMessage}</p>
                <p className="text-xs">Registro enviado para moderacao.</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/transparencia"
                    className="border-2 border-[var(--ink)] bg-white px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--paper)]"
                  >
                    Ir para transparencia
                  </Link>
                  <Link
                    href="/mapa"
                    className="border-2 border-[var(--ink)] bg-white px-3 py-2 text-xs font-bold uppercase hover:bg-[var(--paper)]"
                  >
                    Ir para mapa
                  </Link>
                </div>
              </div>
            ) : null}
          </form>
        </SectionCard>
      ) : null}
    </SiteShell>
  );
}
