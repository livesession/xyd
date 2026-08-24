import "@xyd-js/typespec-opencli";

using XydCli;

namespace Xyd;

@command
@doc("Build your docs")
op build(): void;
