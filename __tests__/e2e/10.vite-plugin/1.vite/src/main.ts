// Proves the host's own hashed bundle in the shared assets/ dir still loads
// after the docs merge.
const el = document.createElement("div");
el.id = "host-js-marker";
el.textContent = "host-js-loaded";
document.body.appendChild(el);
