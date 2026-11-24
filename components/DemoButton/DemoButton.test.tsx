// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { offline } from "@/test/offline";
import { DEMO_FAILED } from "@/lib/sign-in-messages";

const anonymous = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { anonymous } },
}));

const { DemoButton } = await import("./DemoButton");

describe("DemoButton when the connection drops", () => {
  it("says so, stays on the page, and the button works again", async () => {
    anonymous.mockImplementation(offline);
    render(<DemoButton />);
    fireEvent.click(screen.getByRole("button", { name: "Try the demo" }));

    expect(await screen.findByText(DEMO_FAILED)).toBeTruthy();
    const button = screen.getByRole("button", { name: "Try the demo" });
    expect(button.getAttribute("aria-busy")).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});
