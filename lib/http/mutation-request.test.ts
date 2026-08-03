import { describe, expect, it } from "vitest";
import { isTrustedMutationRequest } from "@/lib/http/mutation-request";

function request(fetchSite?: string) {
  return new Request("https://academic-completion.example/api/project", {
    method: "POST",
    headers: fetchSite ? { "sec-fetch-site": fetchSite } : undefined,
  });
}

describe("workflow mutation request guard", () => {
  it("allows same-origin browser mutations", () => {
    expect(isTrustedMutationRequest(request("same-origin"))).toBe(true);
  });

  it("rejects cross-site and same-site mutation requests", () => {
    expect(isTrustedMutationRequest(request("cross-site"))).toBe(false);
    expect(isTrustedMutationRequest(request("same-site"))).toBe(false);
  });

  it("allows requests without Sec-Fetch-Site for server/test clients; auth and ownership remain authoritative", () => {
    expect(isTrustedMutationRequest(request())).toBe(true);
  });
});
