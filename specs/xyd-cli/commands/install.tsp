import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Install the xyd framework manually")
op install(): void;
