// === index.js ===
import { jsx } from "react/jsx-runtime";
function Badge({ variant, size = "md", label }) {
  return jsx("span", { "data-variant": variant, "data-size": size, children: label });
}
Badge.__xydUniform = JSON.parse('{"title":"Badge","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"variant","type":"$xor","description":"Visual style variant","meta":[{"name":"required","value":"true"}],"properties":[{"name":"default","type":"string","description":""},{"name":"success","type":"string","description":""},{"name":"warning","type":"string","description":""},{"name":"error","type":"string","description":""}]},{"name":"size","type":"$xor","description":"Size of the badge","meta":[],"properties":[{"name":"sm","type":"string","description":""},{"name":"md","type":"string","description":""},{"name":"lg","type":"string","description":""}]},{"name":"label","type":"string","description":"Label text","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
export {
  Badge
};

