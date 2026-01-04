import { NextResponse } from "next/server";

/**
 * Vérifie si une chaîne est une IPv4 valide.
 */
function isIpv4(ip: string): boolean {
  // simple but robust IPv4 regex
  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return ipv4Regex.test(ip);
}

/**
 * Vérifie si une chaîne ressemble à une IPv6.
 * On autorise les formats standards et le shorthand (::), pas d'analyse complète mais suffisant pour validation légère.
 */
function isIpv6(ip: string): boolean {
  // catch typical IPv6 representations (contains ':' and no spaces)
  return ip.includes(":") && !/\s/.test(ip);
}

/**
 * Récupère la valeur d'un header de façon sûre pour un objet Headers ou un simple objet record.
 */
function getHeaderValue(
  headers: Headers | Record<string, string | undefined> | null | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const key = name.toLowerCase();
  if (headers instanceof Headers) {
    return headers.get(name) ?? headers.get(key) ?? null;
  }

  const obj = headers as Record<string, string | undefined>;
  return (obj[name] as string) ?? (obj[key] as string) ?? null;
}

/**
 * Retourne la première adresse IP cliente trouvée dans les headers (x-forwarded-for, x-real-ip, etc.).
 * Renvoie `null` si aucune IP valide n'est trouvée.
 */
export function getClientIp(
  headers: Headers | Record<string, string | undefined> | null | undefined
): string | null {
  if (!headers) return null;

  // x-forwarded-for peut contenir une liste d'IPs séparées par des virgules
  const xff = getHeaderValue(headers, "x-forwarded-for");
  if (xff) {
    const candidates = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const c of candidates) {
      if (isIpv4(c) || isIpv6(c)) return c;
    }
  }

  // autres headers fréquents
  const other = [
    "x-real-ip",
    "cf-connecting-ip",
    "fastly-client-ip",
    "true-client-ip",
    "x-client-ip",
  ];
  for (const h of other) {
    const value = getHeaderValue(headers, h);
    if (value && (isIpv4(value) || isIpv6(value))) return value.trim();
  }

  return null;
}

/**
 * Exemple de route GET pour vérifier l'IP détectée. Utilisez cette route pour tester facilement l'extraction.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req.headers);

  return NextResponse.json(
    { ip, message: ip ? "IP détectée" : "Aucune IP valide trouvée" },
    { status: 200 }
  );
}
