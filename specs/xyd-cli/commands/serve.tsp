import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Serve your built docs in production mode")
op serve(): void;
