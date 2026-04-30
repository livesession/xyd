/**
 * Pre-hydration script for access control.
 * Runs synchronously in <head> before React hydration.
 * Prevents flash of protected content (FOPC).
 *
 * Placeholders %%COOKIE_NAME%% and %%GROUPS_CLAIM%% are replaced at build time.
 */
export function generateAuthPrehydrationScript(
  cookieName: string,
  groupsClaim: string
): string {
  const script = `(function(){var n="%%COOKIE_NAME%%";var t=null;try{t=localStorage.getItem(n)}catch(e){}if(!t){var c=document.cookie.split(";");for(var i=0;i<c.length;i++){var p=c[i].trim().split("=");if(p[0]===n||p[0]===n+"-state"){t=decodeURIComponent(p.slice(1).join("="));break}}}var a=false;var g=[];if(t){try{var d=JSON.parse(atob(t.split(".")[1]));if(d.exp&&d.exp*1000>Date.now()){a=true;g=d["%%GROUPS_CLAIM%%"]||[]}}catch(e){}}window.__xydAuthState={authenticated:a,groups:g,token:a?t:null};document.documentElement.setAttribute("data-auth",a?"authenticated":"anonymous")})();`;

  return script
    .replace(/%%COOKIE_NAME%%/g, cookieName)
    .replace(/%%GROUPS_CLAIM%%/g, groupsClaim);
}
