import { e as u } from "./base-FqLVMEt3.js";
function s(r, i) {
  return (e, t, c) => {
    const o = (n) => n.renderRoot?.querySelector(r) ?? null;
    return u(e, t, { get() {
      return o(this);
    } });
  };
}
export {
  s as e
};
