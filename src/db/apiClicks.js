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
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const regionNames = new Intl.DisplayNames(["en"], {type: "region"});
const locationCacheKey = "ipinfo_cache_v1";
const locationCacheTtlMs = 24 * 60 * 60 * 1000;

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

const fetchLocation = async () => {
  if (!ipinfoToken) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800);
  try {
    const response = await fetch(
      `https://ipinfo.io/json?token=${ipinfoToken}`,
      {signal: controller.signal, keepalive: true}
    ).catch(() => null);
    if (!response) return null;
    const data = await response.json();
    setCachedLocation(data);
    return data;
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

export const storeClicks = async ({id}) => {
  try {
    const ua = navigator.userAgent || "";
    const isBot =
      /bot|crawl|spider|preview|facebook|whatsapp|telegram|slack|discord/i.test(
        ua
      );
    if (isBot) return;

    const res = parser.getResult();
    const device = res.type || "desktop";

    const cached = getCachedLocation();
    const locationData = cached || (await fetchLocation()) || {};

    insertClick({
      url_id: id,
      city: locationData.city || "Unknown",
      country: getCountryName(locationData.country),
      device,
    });
  } catch (error) {
    console.error("Error recording click:", error);
  }
};
