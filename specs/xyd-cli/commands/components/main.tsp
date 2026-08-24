import "@xyd-js/typespec-opencli";

// Sub-commands of `components`, imported in the order they should appear.
import "./install.tsp";
import "./uninstall.tsp";

using XydCli;

// The `components` command group. `@doc` (not a `/** */` doc-comment) is the
// description source so it stays the single winner across the namespace's
// reopenings in install.tsp / uninstall.tsp.
@doc("Manage xyd components")
namespace Xyd.components {}
