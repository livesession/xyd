// === index.js ===
import { jsxs } from "react/jsx-runtime";
function EventCard({ event, createdAt, label }) {
  return jsxs("div", { children: [jsxs("h3", { children: [label, ": ", event.title] }), jsxs("p", { children: ["Starts: ", event.startDate.toLocaleDateString()] }), jsxs("p", { children: ["Ends: ", event.endDate.toLocaleDateString()] }), jsxs("p", { children: ["Created: ", createdAt.toLocaleDateString()] }), jsxs("p", { children: ["Attendees: ", event.attendees] })] });
}
EventCard.__xydUniform = JSON.parse('{"title":"EventCard","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"event","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"title","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"startDate","type":"Date","description":"","meta":[{"name":"required","value":"true"}]},{"name":"endDate","type":"Date","description":"","meta":[{"name":"required","value":"true"}]},{"name":"attendees","type":"number","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"createdAt","type":"Date","description":"","meta":[{"name":"required","value":"true"}]},{"name":"label","type":"string","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  EventCard
};

