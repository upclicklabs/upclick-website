import sslChecker from "ssl-checker";
import { SSLResult } from "../types";

export async function checkSSLCertificate(hostname: string): Promise<SSLResult | null> {
  try {
    const result = await sslChecker(hostname, { method: "GET", port: 443 });
    return {
      isValid: result.valid,
      daysRemaining: result.daysRemaining,
    };
  } catch (error) {
    console.log("SSL check failed:", error);
    return null;
  }
}
