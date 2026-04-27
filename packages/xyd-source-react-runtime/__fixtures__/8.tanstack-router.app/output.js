// === assets/employees-HASH.js ===
import { jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
function EmployeeTable({ employees, filters, onFiltersChange }) {
  const filtered = employees.filter((e) => {
    if (filters.activeOnly && !e.isActive)
      return false;
    if (filters.department && e.department !== filters.department)
      return false;
    if (filters.query && !e.name.toLowerCase().includes(filters.query.toLowerCase()))
      return false;
    return true;
  });
  return jsxs("div", { children: [jsx("input", { value: filters.query, onChange: (e) => onFiltersChange({ ...filters, query: e.target.value }), placeholder: "Search..." }), jsxs("table", { children: [jsx("thead", { children: jsxs("tr", { children: [jsx("th", { children: "Name" }), jsx("th", { children: "Department" }), jsx("th", { children: "Salary" })] }) }), jsx("tbody", { children: filtered.map((emp) => jsxs("tr", { children: [jsx("td", { children: jsx(Link, { to: "/employees/$employeeId", params: { employeeId: String(emp.id) }, children: emp.name }) }), jsx("td", { children: emp.department }), jsxs("td", { children: ["$", emp.salary.toLocaleString()] })] }, emp.id)) })] })] });
}
EmployeeTable.__xydUniform = JSON.parse('{"title":"EmployeeTable","canonical":"","description":"","definitions":[{"title":"Props","properties":[{"name":"employees","type":"$array","description":"","meta":[{"name":"required","value":"true"}],"properties":[],"ofProperty":{"name":"","type":"object","properties":[{"name":"id","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"name","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"department","type":"$xor","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"salary","type":"number","description":"","meta":[{"name":"required","value":"true"}]},{"name":"isActive","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}],"description":"","meta":[{"name":"required","value":"true"}]}},{"name":"filters","type":"object","description":"","meta":[{"name":"required","value":"true"}],"properties":[{"name":"query","type":"string","description":"","meta":[{"name":"required","value":"true"}]},{"name":"department","type":"$xor","description":"","meta":[],"properties":[{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]},{"name":"","type":"object","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"activeOnly","type":"boolean","description":"","meta":[{"name":"required","value":"true"}]}]},{"name":"onFiltersChange","type":"(filters: object) => unknown","description":"","meta":[{"name":"required","value":"true"}]}],"meta":[{"name":"type","value":"parameters"}]}],"examples":{"groups":[]}}');
const EMPLOYEES = [{
  id: 1,
  name: "Alice",
  department: "engineering",
  salary: 12e4,
  isActive: true
}, {
  id: 2,
  name: "Bob",
  department: "design",
  salary: 95e3,
  isActive: true
}, {
  id: 3,
  name: "Carol",
  department: "marketing",
  salary: 85e3,
  isActive: false
}];
const SplitComponent = function Employees() {
  const [filters, setFilters] = useState({
    query: "",
    activeOnly: false
  });
  return /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("h1", { children: "Employees" }, void 0, false, {
      fileName: "<ROOT>/src/routes/employees.tsx?tsr-split=component",
      lineNumber: 28,
      columnNumber: 17
    }, this),
    /* @__PURE__ */ jsxDEV(EmployeeTable, { employees: EMPLOYEES, filters, onFiltersChange: setFilters }, void 0, false, {
      fileName: "<ROOT>/src/routes/employees.tsx?tsr-split=component",
      lineNumber: 29,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<ROOT>/src/routes/employees.tsx?tsr-split=component",
    lineNumber: 27,
    columnNumber: 10
  }, this);
};
export {
  SplitComponent as component
};

