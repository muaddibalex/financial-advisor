import { render, screen } from "@testing-library/preact";
import { expect, test } from "vitest";
import { App, aziInRomania } from "../src/app";
import { INTREBARI } from "../src/continut/intrebari";
import { creeazaStocare, depozitInMemorie } from "../src/stocare/stocare";

test("aplicatia porneste la prima intrebare", () => {
  render(<App stocare={creeazaStocare(depozitInMemorie())} incarca={() => Promise.resolve({ sursa: "lipsa", cursuri: null })} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(INTREBARI[0]?.titlu);
});

test("chestionarul are 10 intrebari", () => {
  expect(INTREBARI).toHaveLength(10);
});

test("data de azi este cea din Romania", () => {
  // 21.11.2026, ora 23:30 la Londra este deja 22.11.2026 in Romania.
  expect(aziInRomania(new Date("2026-11-21T23:30:00Z"))).toBe("2026-11-22");
  expect(aziInRomania(new Date("2026-11-21T10:00:00Z"))).toBe("2026-11-21");
});
