// === index.js ===
// src/UserCard.tsx
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function UserCard(props) {
  return _jsxs("div", { children: [props.avatarUrl && _jsx("img", { src: props.avatarUrl, alt: props.name }), _jsx("h3", { children: props.name }), _jsx("p", { children: props.email }), props.role && _jsx("span", { children: props.role })] });
}
UserCard.__xydUniform = JSON.parse(`{"title":"UserCard","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"name","type":"string","description":"Full name of the user","meta":[{"name":"required","value":"true"}]},{"name":"email","type":"string","description":"Email address of the user","meta":[{"name":"required","value":"true"}]},{"name":"avatarUrl","type":"string","description":"URL to the user's avatar image","meta":[]},{"name":"role","type":"$xor","description":"Role or title of the user","meta":[],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"loading","type":"boolean","description":"Whether the card is in a loading state","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}`);
export {
  UserCard
};

