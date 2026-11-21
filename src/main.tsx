import { render } from "preact";
import { App } from "./app";
import "./stil/baza.css";

const radacina = document.getElementById("app");
if (radacina) {
  render(<App />, radacina);
}
