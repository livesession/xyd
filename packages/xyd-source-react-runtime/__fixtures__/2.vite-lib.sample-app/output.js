// === index.js ===
import { jsxs, jsx } from "react/jsx-runtime";
import { createContext, useState, useMemo } from "react";
function UserProfile({ user, showAddress, onEdit, className, maxTags }) {
  const visibleTags = maxTags ? user.tags.slice(0, maxTags) : user.tags;
  return jsxs("div", { className, children: [jsx("h2", { children: user.name }), jsx("p", { children: user.email }), jsx("span", { children: user.role }), showAddress && user.address && jsxs("address", { children: [user.address.street, ", ", user.address.city, ", ", user.address.country, user.address.zip && ` ${user.address.zip}`] }), jsx("div", { children: visibleTags.map((tag) => jsx("span", { children: tag }, tag)) }), jsx("button", { type: "button", onClick: () => onEdit(user.id), children: "Edit" })] });
}
UserProfile.__xydUniform = JSON.parse('{"title":"UserProfile","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"user","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"id","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"name","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"email","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"$xor","description":"","properties":[{"name":"role","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"object","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]},{"name":"address","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"street","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"city","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"country","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"zip","type":"string","description":"","meta":[]}]},{"name":"tags","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"joinedAt","type":"string","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"showAddress","type":"boolean","description":"Show the full address block","meta":[]},{"name":"className","type":"string","description":"Custom CSS class name","meta":[]},{"name":"maxTags","type":"number","description":"Maximum number of tags to display","meta":[]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
const UserContext = createContext(null);
UserContext.displayName = "UserContext";
function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const value = useMemo(() => ({
    currentUser,
    isLoggedIn: currentUser !== null,
    login: setCurrentUser,
    logout: () => setCurrentUser(null)
  }), [currentUser]);
  return jsx(UserContext.Provider, { value, children });
}
UserContext.__xydUniform = JSON.parse('{"title":"UserContext","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"currentUser","type":"$xor","description":"","properties":[{"name":"currentUser","type":"null","description":"","meta":[{"name":"required","value":"true"}]},{"name":"currentUser","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"id","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"name","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"email","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"$xor","description":"","properties":[{"name":"role","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"role","type":"object","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"required","value":"true"}]},{"name":"address","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"street","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"city","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"country","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"zip","type":"string","description":"","meta":[]}]},{"name":"tags","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"string","properties":[],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"joinedAt","type":"string","description":"","meta":[{"name":"required","value":"true"}]}]}],"meta":[{"name":"required","value":"true"}]},{"name":"isLoggedIn","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  UserContext,
  UserProfile,
  UserProvider
};

