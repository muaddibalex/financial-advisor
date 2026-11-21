import { render, screen } from "@testing-library/preact";
import { expect, test } from "vitest";
import { App } from "../src/app";

test("aplicatia porneste si afiseaza titlul", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Ghid de economii");
});
