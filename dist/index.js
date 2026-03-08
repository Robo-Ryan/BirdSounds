// authAPI/src/index.ts
console.log("BOOTING BirdSounds index.ts");
import "dotenv/config";
import express from "express";
import cors from "cors";
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3002;
app.use(cors());
app.use(express.json());
// Put your Nuthatch key in .env as NUTHATCH_API_KEY (recommended)
// Example: NUTHATCH_API_KEY=xxxxxx
const NUTHATCH_API_KEY = process.env.NUTHATCH_API_KEY;
const XENOCANTO_API_KEY = process.env.XENOCANTO_API_KEY;
function assertEnvKey(key, name) {
    if (!key) {
        throw new Error(`missing_env:${name} (Add ${name} to your .env and restart the server)`);
    }
}
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
async function fetchRandomBirdFromNuthatch() {
    assertEnvKey(NUTHATCH_API_KEY, "NUTHATCH_API_KEY");
    // NOTE: Nuthatch returns a list. We request only birds that have images.
    // If you want more variety, remove hasImg=true.
    const url = new URL("https://nuthatch.lastelm.software/v2/birds");
    url.searchParams.set("hasImg", "true");
    const res = await fetch(url.toString(), {
        headers: {
            "api-key": NUTHATCH_API_KEY,
        },
    });
    if (!res.ok) {
        throw new Error(`nuthatch_failed:${res.status}`);
    }
    const data = (await res.json());
    const birds = Array.isArray(data.entities) ? data.entities : [];
    if (!birds.length) {
        throw new Error("nuthatch_empty:No birds returned");
    }
    return pickRandom(birds);
}
async function fetchOneRecordingFromXenoCanto(sciName) {
    // If no key, skip audio entirely (don’t fail the endpoint)
    if (!XENOCANTO_API_KEY)
        return null;
    const parts = sciName.trim().split(/\s+/);
    const gen = parts[0]?.toLowerCase();
    const sp = parts[1]?.toLowerCase();
    // If we can’t parse genus/species, don’t fail the endpoint
    if (!gen || !sp)
        return null;
    // v3 requires tagged queries. Use spaces; URLSearchParams will encode spaces as `+`.
    const query = `gen:${gen} sp:${sp} grp:birds`;
    const url = new URL("https://xeno-canto.org/api/3/recordings");
    url.searchParams.set("query", query);
    url.searchParams.set("key", XENOCANTO_API_KEY);
    url.searchParams.set("per_page", "50");
    const res = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
            "User-Agent": "BirdSounds/1.0 (local dev)",
        },
    });
    if (!res.ok)
        return null;
    const data = (await res.json());
    const recs = Array.isArray(data.recordings) ? data.recordings : [];
    const withAudio = recs.filter((r) => typeof r.file === "string" && r.file);
    if (!withAudio.length)
        return null;
    return pickRandom(withAudio);
}
function normalizeXcFileUrl(file) {
    return file.startsWith("//") ? `https:${file}` : file;
}
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// GET /random-bird
// Returns a random bird (from Nuthatch) and (if found) a random recording (from Xeno-canto)
app.get("/random-bird", async (_req, res) => {
    try {
        const bird = await fetchRandomBirdFromNuthatch();
        const recording = await fetchOneRecordingFromXenoCanto(bird.sciName);
        res.json({
            bird: {
                name: bird.name,
                sciName: bird.sciName,
                status: bird.status,
                family: bird.family,
                order: bird.order,
                images: bird.images ?? [],
            },
            sound: recording
                ? {
                    source: "xeno-canto",
                    id: recording.id ?? null,
                    english_name: recording.en ?? null,
                    type: recording.type ?? null,
                    location: recording.loc ?? null,
                    country: recording.cnt ?? null,
                    url: recording.file ? normalizeXcFileUrl(recording.file) : null,
                }
                : null,
            meta: {
                fetched_at: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "unknown_error";
        res.status(500).json({ error: message });
    }
});
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
