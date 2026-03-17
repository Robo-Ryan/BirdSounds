import { useState } from "react";
import MapPicker, { type LatLon } from "./MapPicker";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

interface BirdResponse {
  bird: {
    name: string;
    sciName: string;
    status?: string;
    family?: string;
    order?: string;
    images?: string[];
  };
  sound: {
    source: string;
    url?: string | null;
    english_name?: string | null;
    type?: string | null;
    location?: string | null;
    country?: string | null;
  } | null;
  meta: {
    fetched_at: string;
  };
}

interface RegionalBird {
  name: string;
  sciName: string;
  recordingId: string | null;
  audioUrl: string | null;
  recordingType: string | null;
  location: string | null;
  country: string | null;
}

type Tab = "region" | "random";

export default function App() {
  const [tab, setTab] = useState<Tab>("region");

  // Region tab state
  const [regionBirds, setRegionBirds] = useState<RegionalBird[] | null>(null);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  // Random bird tab state
  const [bird, setBird] = useState<BirdResponse | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState<string | null>(null);

  async function handleRegionConfirm(pos: LatLon) {
    setRegionLoading(true);
    setRegionError(null);
    setRegionBirds(null);
    setPlayingUrl(null);
    try {
      const res = await fetch(`${API_BASE}/birds-by-region?lat=${pos.lat}&lon=${pos.lon}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data = await res.json();
      setRegionBirds(data.birds ?? []);
    } catch (err) {
      setRegionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRegionLoading(false);
    }
  }

  async function fetchRandomBird() {
    setRandomLoading(true);
    setRandomError(null);
    try {
      const res = await fetch(`${API_BASE}/random-bird`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const data: BirdResponse = await res.json();
      setBird(data);
    } catch (err) {
      setRandomError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRandomLoading(false);
    }
  }

  const image = bird?.bird.images?.[0];
  const audioUrl = bird?.sound?.url;

  return (
    <div className="container">
      <h1>BirdSounds</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === "region" ? "active" : ""}`}
          onClick={() => setTab("region")}
        >
          Birds by Region
        </button>
        <button
          className={`tab-btn ${tab === "random" ? "active" : ""}`}
          onClick={() => setTab("random")}
        >
          Random Bird
        </button>
      </div>

      {tab === "region" && (
        <div className="region-tab">
          <MapPicker onConfirm={handleRegionConfirm} loading={regionLoading} />

          {regionError && <p className="error">{regionError}</p>}

          {regionBirds && regionBirds.length === 0 && (
            <p className="no-results">No birds found for this region. Try a different location.</p>
          )}

          {regionBirds && regionBirds.length > 0 && (
            <div className="bird-grid">
              <h2 className="grid-title">Birds in this region</h2>
              {regionBirds.map((b, i) => (
                <div key={i} className="bird-row">
                  <div className="bird-row-info">
                    <span className="bird-row-name">{b.name}</span>
                    <span className="bird-row-sci">{b.sciName}</span>
                    {b.recordingType && (
                      <span className="bird-row-type">{b.recordingType}</span>
                    )}
                  </div>
                  <div className="bird-row-actions">
                    {b.audioUrl ? (
                      playingUrl === b.audioUrl ? (
                        <audio
                          className="audio-inline"
                          controls
                          autoPlay
                          src={b.audioUrl}
                          onEnded={() => setPlayingUrl(null)}
                        />
                      ) : (
                        <button
                          className="play-btn"
                          onClick={() => setPlayingUrl(b.audioUrl)}
                        >
                          ▶ Play
                        </button>
                      )
                    ) : (
                      <span className="no-audio-sm">No audio</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "random" && (
        <div className="random-tab">
          <button className="fetch-btn" onClick={fetchRandomBird} disabled={randomLoading}>
            {randomLoading ? "Loading..." : "Get Random Bird"}
          </button>

          {randomError && <p className="error">{randomError}</p>}

          {bird && (
            <div className="card">
              {image && <img className="bird-image" src={image} alt={bird.bird.name} />}
              <div className="card-body">
                <h2>{bird.bird.name}</h2>
                <p className="sci-name">{bird.bird.sciName}</p>
                <div className="details">
                  {bird.bird.order && <span>Order: {bird.bird.order}</span>}
                  {bird.bird.family && <span>Family: {bird.bird.family}</span>}
                  {bird.bird.status && <span>Status: {bird.bird.status}</span>}
                </div>
                {audioUrl ? (
                  <audio className="audio-player" controls src={audioUrl} />
                ) : (
                  <p className="no-audio">No audio available for this bird</p>
                )}
                {bird.sound?.location && (
                  <p className="location">
                    Recorded in {bird.sound.location}
                    {bird.sound.country ? `, ${bird.sound.country}` : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
