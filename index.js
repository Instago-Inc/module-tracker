const browser = require("browser@1.0.0");
const b64 = require("b64@1.0.0");
const diff = require("diff@1.0.0");

function storageKey(url) {
  const safe = String(url).replace(/[^a-z0-9]/gi, "_");
  return `tracker/${safe}.json`;
}

function utf8ToBinary(str) {
  const bytes = b64.utf8Bytes(String(str || ""));
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i] & 0xff);
  }
  return out;
}

function binaryToUtf8(bin) {
  if (typeof Buffer === "function" && Buffer.from) {
    try {
      return Buffer.from(bin, "binary").toString("utf8");
    } catch {
      // fall through
    }
  }
  try {
    return decodeURIComponent(
      bin
        .split("")
        .map((ch) => "%" + ch.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return bin;
  }
}

async function readPrevious(url, opts) {
  const storage = sys.storage.get("tracker", opts);
  try {
    const key = storageKey(url);
    const result = await storage.read({ path: key });
    if (!result || !result.dataBase64) return null;
    const binary = b64.decodeAscii(result.dataBase64) || "";
    const jsonStr = binaryToUtf8(binary);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function writeSnapshot(url, snapshot, opts) {
  const storage = sys.storage.get("tracker", opts);
  const key = storageKey(url);
  const serialized = JSON.stringify(snapshot || {});
  const binary = utf8ToBinary(serialized);
  const payload = b64.encodeAscii(binary);
  await storage.save({ path: key, dataBase64: payload });
}

function hasDelta(delta) {
  if (!delta) return false;
  if (delta.headings) return true;
  if (delta.html && (!Array.isArray(delta.html) || delta.html.length)) return true;
  if (delta.text && (!Array.isArray(delta.text) || delta.text.length)) return true;
  return false;
}

async function trackPage(url, options = {}) {
  if (!url || typeof url !== "string") {
    throw new Error("tracker.trackPage expects a URL string");
  }

  const page = browser.page(url, { refresh: !(options && options.noRefresh) });
  const headings = page.getHeaders();
  const html = page.getHTML();
  const text = typeof page.getText === "function" ? page.getText() : "";
  page.close();

  const snapshot = {
    url,
    headings,
    html,
    text,
    fetchedAt: new Date().toISOString(),
  };

  const previous = await readPrevious(url, options);
  await writeSnapshot(url, snapshot, options);

  if (!previous) {
    return { url, firstVisit: true, snapshot, delta: null };
  }

  const headingDeltaRaw = diff.diff(previous.headings, snapshot.headings);
  const htmlDeltaRaw = diff.diff(previous.html, snapshot.html);
  const textDeltaRaw = diff.diff(previous.text, snapshot.text);

  const delta = {
    headings: headingDeltaRaw,
    html: diff.applyTextDiff
      ? diff.applyTextDiff(htmlDeltaRaw)
      : htmlDeltaRaw,
    text: diff.applyTextDiff ? diff.applyTextDiff(textDeltaRaw) : textDeltaRaw,
  };

  const normalizedDelta = hasDelta(delta) ? delta : null;

  return { url, firstVisit: false, snapshot, previous, delta: normalizedDelta };
}

async function trackPages(urls, options = {}) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("tracker.trackPages expects a non-empty array of URLs");
  }

  const results = [];
  for (const url of urls) {
    try {
      const result = await trackPage(url, options);
      results.push(result);
    } catch (err) {
      results.push({
        url,
        error: err && (err.message || String(err)),
      });
    }
  }

  const changes = results.filter(
    (item) => item && !item.error && !item.firstVisit && hasDelta(item.delta)
  );

  return { results, changes };
}

module.exports = {
  trackPage,
  trackPages,
};
