//IMPORTS
import "dotenv/config";
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
    // Xeno-canto API 2.0: https://www.xeno-canto.org/article/153
    // Query syntax: https://xeno-canto.org/help/search
    // We search using the scientific name for best matches.
    // Example query: "Turdus migratorius"
    const query = `\"${sciName}\"`;
    const url = new URL("https://xeno-canto.org/api/2/recordings");
    url.searchParams.set("query", query);
    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`xenocanto_failed:${res.status}`);
    }
    const data = (await res.json());
    const recs = Array.isArray(data.recordings) ? data.recordings : [];
    // Only keep recordings that have an audio file URL
    const withAudio = recs.filter((r) => typeof r.file === "string" && r.file);
    if (!withAudio.length)
        return null;
    return pickRandom(withAudio);
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
                    url: recording.file ?? null,
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
