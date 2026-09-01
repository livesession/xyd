// proves the host's own hashed bundle still loads after the docs merge
const el = document.createElement("div");
el.id = "host-js-marker";
el.className = "jsnote";
el.textContent = "host-js-loaded";
document.querySelector("main > div").appendChild(el);
