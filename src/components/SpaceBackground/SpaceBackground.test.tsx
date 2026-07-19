import { render, screen } from "@testing-library/react";
import { SpaceBackground } from "./SpaceBackground";

describe("SpaceBackground", () => {
  it("renders children and forwards div attributes", () => {
    const { container } = render(
      <SpaceBackground
        className="custom"
        data-testid="space"
        aria-label="Space scene"
        style={{ padding: 12 }}
      >
        <h1>Inside the stars</h1>
      </SpaceBackground>,
    );

    expect(screen.getByText("Inside the stars")).toBeInTheDocument();
    expect(screen.getByTestId("space")).toHaveClass("space-background", "custom");
    expect(screen.getByTestId("space")).toHaveStyle({ padding: "12px" });
    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(container.querySelector(".space-background__horizon")).toBeNull();
    expect(container.querySelectorAll(".space-background__aurora")).toHaveLength(2);
  });

  it("can hide the planet and apply custom colors", () => {
    const { container } = render(
      <SpaceBackground
        showPlanet={false}
        colors={{ leftGlow: "#123456" }}
        data-testid="space"
      />,
    );

    expect(container.querySelector(".space-background__planet")).toBeNull();
    expect(screen.getByTestId("space").style.getPropertyValue("--space-left-glow"))
      .toBe("#123456");
  });

  it("cancels animation and disconnects observers on unmount", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<SpaceBackground />);
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it("disables CSS motion when motion is none", () => {
    render(<SpaceBackground motion="none" data-testid="space" />);
    expect(screen.getByTestId("space")).toHaveClass(
      "space-background--motion-none",
    );
  });
});
