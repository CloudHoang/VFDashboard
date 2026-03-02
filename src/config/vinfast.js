import staticAliasMap from "./static_alias_map.json";

export const DEFAULT_REGION = "vn";

export const REGIONS = {
  us: {
    name: "United States",
    auth0_domain: "vinfast-us-prod.us.auth0.com",
    auth0_client_id: "xhGY7XKDFSk1Q22rxidvwujfz0EPAbUP",
    auth0_audience: "https://vinfast-us-prod.us.auth0.com/api/v2/",
    api_base: "https://mobile.connected-car.vinfastauto.us",
  },
  eu: {
    name: "Europe",
    auth0_domain: "vinfast-eu-prod.eu.auth0.com",
    auth0_client_id: "dxxtNkkhsPWW78x6s1BWQlmuCfLQrkze",
    auth0_audience: "https://vinfast-eu-prod.eu.auth0.com/api/v2/",
    api_base: "https://mobile.connected-car.vinfastauto.eu",
  },
  vn: {
    name: "Vietnam",
    auth0_domain: "vin3s.au.auth0.com",
    auth0_client_id: "jE5xt50qC7oIh1f32qMzA6hGznIU5mgH",
    // APK uses VinFast API as audience, NOT Auth0 Management API.
    // This affects the JWT structure and Cognito identity mapping.
    auth0_audience: "https://mobile.connected-car.vinfast.vn",
    api_base: "https://mobile.connected-car.vinfast.vn",
  },
};

export const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-SERVICE-NAME": "CAPP",
  "X-APP-VERSION": "2.17.5",
  "X-Device-Platform": "android",
  "X-Device-Family": "SM-F946B",
  "X-Device-OS-Version": "android 14",
  "X-Device-Locale": "vi-VN",
  "X-Timezone": "Asia/Ho_Chi_Minh",
  "X-Device-Identifier": "vfdashboard-community-edition",
  "X-IMEI": "",
  "User-Agent": "android - vfdashboard-community-edition - 2.17.5",
};

// MQTT Configuration (from APK local-configuration.json)
export const MQTT_CONFIG = {
  vn: {
    endpoint: "prod.iot.connected-car.vinfast.vn",
    region: "ap-southeast-1",
    cognitoPoolId: "ap-southeast-1:c6537cdf-92dd-4b1f-99a8-9826f153142a",
    cognitoLoginProvider: "vin3s.au.auth0.com",
    heartbeatInterval: 120000, // 2 minutes
    keepAlive: 300, // seconds
  },
};

/**
 * Backup proxy endpoints for IP rotation / failover.
 * When the primary Cloudflare proxy gets 429 from VinFast,
 * the client falls back to these alternative proxies (different egress IPs).
 *
 * Each entry: { baseUrl, pathPrefix }
 * - baseUrl: The proxy host URL
 * - pathPrefix: Path prefix for the proxy endpoint
 *
 * Legacy Vercel proxy templates are archived in branch: archive/root-proxy-folders
 * Set VITE_BACKUP_PROXY_URL env var to enable.
 */
export const BACKUP_PROXIES = (() => {
  const proxies = [];
  // Support VITE_BACKUP_PROXY_URL env var (set at build time or in .env)
  const vercelUrl =
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_BACKUP_PROXY_URL;
  if (vercelUrl) {
    proxies.push({
      baseUrl: vercelUrl.replace(/\/$/, ""),
      pathPrefix: "/api/vf-proxy",
    });
  }
  return proxies;
})();

export const STATIC_ALIAS_MAP_EXPORT = staticAliasMap;
