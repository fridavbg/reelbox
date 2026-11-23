import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

// Calls the button's own click handler, as the browser would on a click.
const click = (loading: boolean) => {
  const onClick = vi.fn();
  const button = Button({ loading, onClick, children: "Save" });
  const event = { preventDefault: vi.fn() };
  button.props.onClick(event);
  return { onClick, event };
};

describe("Button", () => {
  it("runs onClick when not loading", () => {
    const { onClick, event } = click(false);
    expect(onClick).toHaveBeenCalledWith(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores a click while loading, and cancels a form submit", () => {
    const { onClick, event } = click(true);
    expect(onClick).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("stays enabled while loading, marked busy and unavailable", () => {
    const html = renderToStaticMarkup(
      <Button loading loadingLabel="Saving…">
        Save
      </Button>,
    );
    expect(html).not.toMatch(/\sdisabled=/);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("Saving…");
  });

  it("has no busy or unavailable state when not loading", () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);
    expect(html).not.toContain("aria-busy");
    expect(html).not.toContain("aria-disabled");
  });
});
