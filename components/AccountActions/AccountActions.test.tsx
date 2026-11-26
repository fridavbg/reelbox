import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: {} }));

const { AccountActions } = await import("./AccountActions");

describe("AccountActions", () => {
  it("links to the import for real users", () => {
    const html = renderToStaticMarkup(<AccountActions demo={false} />);
    expect(html).toMatch(/<a[^>]*href="\/import"[^>]*>Import<\/a>/);
    expect(html).toContain("Sign out");
  });

  it("links demo users to the import too, where they can try the sample", () => {
    const html = renderToStaticMarkup(<AccountActions demo />);
    expect(html).toMatch(/<a[^>]*href="\/import"[^>]*>Import<\/a>/);
    expect(html).toContain("Leave demo");
  });
});
