import { createApp } from "../../lib/vue-thin.esm.js";
import { app } from "./app.js";

const rootContainer = document.querySelector("#app");
createApp(app).mount(rootContainer);
