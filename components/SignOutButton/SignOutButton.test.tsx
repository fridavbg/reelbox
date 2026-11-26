// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { offline } from "@/test/offline";
import {
  LEAVE_DEMO_FAILED,
  LEAVE_DEMO_UNEXPECTED,
  SIGN_OUT_FAILED,
  SIGN_OUT_UNEXPECTED,
} from "@/lib/sign-in-messages";

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

  it("stops loading, stays and says so when signing out fails", async () => {
    signOut.mockImplementation(offline);
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByText(SIGN_OUT_FAILED)).toBeTruthy();

    const button = await screen.findByRole("button", { name: "Sign out" });
    await vi.waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });

  it("stops loading, stays and says so when leaving the demo fails", async () => {
    deleteAnonymousUser.mockImplementation(offline);
    signOut.mockImplementation(offline);
    render(<SignOutButton demo />);
    fireEvent.click(screen.getByRole("button", { name: "Leave demo" }));

    expect(await screen.findByText(LEAVE_DEMO_FAILED)).toBeTruthy();

    const button = await screen.findByRole("button", { name: "Leave demo" });
    await vi.waitFor(() => expect(button.getAttribute("aria-busy")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });

  it("hides the message when trying again and when dismissed", async () => {
    signOut.mockImplementation(offline);
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText(SIGN_OUT_FAILED);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(SIGN_OUT_FAILED)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await screen.findByText(SIGN_OUT_FAILED);
    signOut.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.queryByText(SIGN_OUT_FAILED)).toBeNull();
  });

  it("doesn't blame the connection when something unexpected breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signOut.mockRejectedValue(new Error("A bug"));
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText(SIGN_OUT_UNEXPECTED)).toBeTruthy();
  });

  it("names the step that broke when leaving the demo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    deleteAnonymousUser.mockRejectedValue(new Error("A bug"));
    signOut.mockRejectedValue(new Error("A bug"));
    render(<SignOutButton demo />);
    fireEvent.click(screen.getByRole("button", { name: "Leave demo" }));
    expect(await screen.findByText(LEAVE_DEMO_UNEXPECTED)).toBeTruthy();
  });
});
