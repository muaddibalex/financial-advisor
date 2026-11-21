import { render } from "preact";
import { App } from "./app";
import { inregistreazaServiceWorker } from "./pwa/inregistrare";
import "./stil/baza.css";

const radacina = document.getElementById("app");
if (radacina) {
  render(<App />, radacina);
}

// Doar in build-ul de productie: in timpul dezvoltarii, o copie pastrata ar ascunde modificarile.
if (import.meta.env.PROD) {
  inregistreazaServiceWorker();
}
