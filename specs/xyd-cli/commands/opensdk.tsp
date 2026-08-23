import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Run the OpenSDK toolchain (requires `xyd components install opensdk`)")
op opensdk(): void;
