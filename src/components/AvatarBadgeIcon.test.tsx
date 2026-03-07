import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AvatarBadgeIcon } from "./AvatarBadgeIcon";

describe("AvatarBadgeIcon", () => {
  it("keeps the original blossom bloom geometry", () => {
    const { container } = render(<AvatarBadgeIcon preset="blossom" />);
    const svg = container.querySelector('[data-avatar-preset="blossom"]');

    expect(svg).toBeInTheDocument();
    expect(svg?.querySelectorAll("g[transform]")).toHaveLength(8);
  });
});
