import { jsxDEV } from "react/jsx-dev-runtime";
function UserCard(props) {
  return /* @__PURE__ */ jsxDEV("div", { children: [
    props.avatarUrl && /* @__PURE__ */ jsxDEV("img", { src: props.avatarUrl, alt: props.name }, void 0, false, {
      fileName: "<ROOT>/src/UserCard.tsx",
      lineNumber: 31,
      columnNumber: 33
    }, this),
    /* @__PURE__ */ jsxDEV("h3", { children: props.name }, void 0, false, {
      fileName: "<ROOT>/src/UserCard.tsx",
      lineNumber: 32,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("p", { children: props.email }, void 0, false, {
      fileName: "<ROOT>/src/UserCard.tsx",
      lineNumber: 33,
      columnNumber: 13
    }, this),
    props.role && /* @__PURE__ */ jsxDEV("span", { children: props.role }, void 0, false, {
      fileName: "<ROOT>/src/UserCard.tsx",
      lineNumber: 34,
      columnNumber: 28
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/UserCard.tsx",
    lineNumber: 30,
    columnNumber: 9
  }, this);
}
UserCard.__xydUniform = JSON.parse(`{"title":"UserCard","canonical":"xyd-fixture-1-user-card/components/UserCard","description":"A card component that displays user information with avatar, name, and role.\\n","context":{"symbolId":"1","symbolName":"UserCard","symbolKind":64,"packageName":"xyd-fixture-1-user-card","fileName":"UserCard.tsx","fileFullPath":"src/UserCard.tsx","line":28,"col":16,"signatureText":{"code":"export function UserCard(props: UserCardProps);","lang":"ts"},"sourcecode":{"code":"export function UserCard(props: UserCardProps) {\\n    return (\\n        <div>\\n            {props.avatarUrl && <img src={props.avatarUrl} alt={props.name} />}\\n            <h3>{props.name}</h3>\\n            <p>{props.email}</p>\\n            {props.role && <span>{props.role}</span>}\\n        </div>\\n    );\\n}","lang":"ts"},"meta":[],"category":"Component","group":["xyd-fixture-1-user-card","Component"]},"examples":{"groups":[]},"definitions":[{"title":"Props","properties":[{"name":"name","type":"string","description":"Full name of the user\\n","meta":[{"name":"required","value":"true"}]},{"name":"email","type":"string","description":"Email address of the user\\n","meta":[{"name":"required","value":"true"}]},{"name":"avatarUrl","type":"string","description":"URL to the user's avatar image\\n","meta":[]},{"name":"role","type":"string","description":"Role or title of the user\\n","meta":[]},{"name":"loading","type":"boolean","description":"Whether the card is in a loading state\\n","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}]}`);
export {
  UserCard
};
