/**
 * One-liner script to inject Ask AI Widget
 * Copy and paste this into any website's browser console or include as a script tag
 */

(function (s) {
  var d = document;
  if (d.getElementById("xyd-ask-ai-widget")) return;
  var sc = d.createElement("script");
  sc.src = s + "/widget.js";
  sc.setAttribute("data-server-url", s);
  sc.async = true;
  d.head.appendChild(sc);
  console.log("🤖 Ask AI Widget injected:", s);
})("http://localhost:3500");
