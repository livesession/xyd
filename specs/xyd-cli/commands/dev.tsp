import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Run your docs locally in development mode")
op dev(): void;
