import {UAParser} from "ua-parser-js";
import supabase from "./supabase";

export async function getClicksForUrls(urlIds) {
  const {data, error} = await supabase
    .from("clicks")
    .select("*")
    .in("url_id", urlIds);

  if (error) {
    console.error("Error fetching clicks:", error);
    return null;
  }

  return data;
}

export async function getClicksForUrl(url_id) {
  const {data, error} = await supabase
    .from("clicks")
    .select("*")
    .eq("url_id", url_id);

  if (error) {
    console.error(error);
    throw new Error("Unable to load Stats");
  }

  return data;
}

const parser = new UAParser();

const ipinfoToken = import.meta.env.VITE_IPINFO_TOKEN;
const ipapiKey = import.meta.env.VITE_IPAPI_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const regionNames = new Intl.DisplayNames(["en"], {type: "region"});
const locationCacheKey = "ipinfo_cache_v1";
const locationCacheTtlMs = 24 * 60 * 60 * 1000;
const clickBucketMs = 2 * 1000;

const getCountryName = (code) => {
  if (!code) return "Unknown";
  try {
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
};

const getCachedLocation = () => {
  try {
    const raw = localStorage.getItem(locationCacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.data) return null;
    if (Date.now() - parsed.ts > locationCacheTtlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedLocation = (data) => {
  try {
    localStorage.setItem(
      locationCacheKey,
      JSON.stringify({ts: Date.now(), data})
    );
  } catch {
    return;
  }
};

const normalizeLocation = (data = {}) => ({
  ip: data.ip || data?.ip_address || null,
  city: data.city || null,
  region: data.region || data.region_name || null,
  country: data.country || data.country_code || data.country_code2 || null,
  countryName: data.country_name || null,
});

const fetchLocation = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800);
  try {
    if (ipapiKey) {
      const response = await fetch(
        `https://api.ipapi.com/api/check?access_key=${ipapiKey}`,
        {signal: controller.signal, keepalive: true}
      ).catch(() => null);
      if (response) {
        const raw = await response.json();
        const data = normalizeLocation(raw);
        setCachedLocation(data);
        return data;
      }
    } else {
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
        keepalive: true,
      }).catch(() => null);
      if (response) {
        const raw = await response.json();
        const data = normalizeLocation({
          ip: raw?.ip,
          city: raw?.city,
          region: raw?.region,
          country: raw?.country_code,
          country_name: raw?.country_name,
        });
        setCachedLocation(data);
        return data;
      }
    }

    if (ipinfoToken) {
      const response = await fetch(
        `https://ipinfo.io/json?token=${ipinfoToken}`,
        {signal: controller.signal, keepalive: true}
      ).catch(() => null);
      if (response) {
        const raw = await response.json();
        const data = normalizeLocation(raw);
        setCachedLocation(data);
        return data;
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const insertClick = (payload) => {
  if (!supabaseUrl || !supabaseAnonKey) return;
  fetch(`${supabaseUrl}/rest/v1/clicks`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => null);
};

const fallbackHash = (value) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

const getUaHash = async (value) => {
  try {
    if (!value) return null;
    if (crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return fallbackHash(value);
  } catch {
    return fallbackHash(value || "unknown");
  }
};

const shouldSkipClick = (id) => {
  try {
    const key = `click_${id}`;
    const now = Date.now();
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const last = Number(raw);
      if (!Number.isNaN(last) && now - last < 1000) {
        return true;
      }
    }
    sessionStorage.setItem(key, String(now));
  } catch {
    return false;
  }
  return false;
};

export const storeClicks = async ({id}) => {
  try {
    if (shouldSkipClick(id)) return;
    if (document.visibilityState && document.visibilityState !== "visible") {
      return;
    }

    const ua = navigator.userAgent || "";
    const isBot =
      /bot|crawl|spider|preview|facebook|whatsapp|telegram|slack|discord/i.test(
        ua
      );
    if (isBot) return;

    const res = parser.getResult();
    const device = res.device?.type || "desktop";

    const cached = getCachedLocation();
    const [locationData, uaHash] = await Promise.all([
      cached ? Promise.resolve(cached) : fetchLocation(),
      getUaHash(ua),
    ]);
    const locationFailed = !locationData;
    const countryCode = locationData?.country || null;
    const countryName = locationData?.countryName || null;
    const hashSeed = `${ua}|${locationData?.ip || ""}|${countryCode || ""}`;
    const finalUaHash = uaHash || (await getUaHash(hashSeed)) || "unknown";

    insertClick({
      url_id: id,
      city: locationFailed ? "Unknown" : locationData?.city || null,
      region: locationFailed ? "Unknown" : locationData?.region || null,
      country: locationFailed
        ? "Unknown"
        : countryName || getCountryName(countryCode) || null,
      device,
      ua_hash: finalUaHash,
      bucket: Math.floor(Date.now() / clickBucketMs),
    });
  } catch (error) {
    console.error("Error recording click:", error);
  }
};
