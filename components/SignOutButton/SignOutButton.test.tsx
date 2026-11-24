// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { offline } from "@/test/offline";

const signOut = vi.fn();
const deleteAnonymousUser = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut, deleteAnonymousUser },
}));

const { SignOutButton } = await import("./SignOutButton");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SignOutButton", () => {
  it("signs out and goes to the start page", async () => {
    signOut.mockResolvedValue({ data: {}, error: null });
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("stops loading and stays when signing out fails", async () => {
    signOut.mockImplementation(offline);
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    const button = await screen.findByRole("button", { name: "Sign out" });
    await vi.waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });

  it("stops loading and stays when leaving the demo fails", async () => {
    deleteAnonymousUser.mockImplementation(offline);
    signOut.mockImplementation(offline);
    render(<SignOutButton demo />);
    fireEvent.click(screen.getByRole("button", { name: "Leave demo" }));

    const button = await screen.findByRole("button", { name: "Leave demo" });
    await vi.waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });
});
