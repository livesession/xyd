#compdef xyd

_xyd() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C \
    '(-h --help)'{-h,--help}'[Print this help message and exit]' \
    '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
    '--verbose[Enable verbose output]' \
    '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
    '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
    '--debug[Enable debug output]' \
    '1: :->command' \
    '*::arg:->args' && return 0

  case $state in
    command)
      local -a commands
      commands=(
        'dev:Run your docs locally in development mode'
        'build:Build your docs'
        'serve:Serve your built docs in production mode'
        'install:Install the xyd framework manually'
        'migrateme:Migrate your docs to the new xyd framework'
        'components:Manage xyd components'
        'opensdk:Run the OpenSDK toolchain (requires `xyd components install opensdk`)'
        'completion:Generate shell completions or the CLI OpenCLI document. Run `xyd completion <zsh|fish>` to print a script, `xyd completion install [shell]` to install it, or `xyd completion opencli` to print the OpenCLI document.'
      )
      _describe -t commands 'xyd command' commands
      ;;
    args)
      case $line[1] in
        dev)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        build)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        serve)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        install)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        migrateme)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        components)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        opensdk)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
        completion)
          _arguments \
            '(-h --help)'{-h,--help}'[Print this help message and exit]' \
            '(-v --version)'{-v,--version}'[Print the CLI version and exit]' \
            '--verbose[Enable verbose output]' \
            '(-p --port)'{-p,--port}'[Port to run the dev server on]:value:' \
            '(-l --logLevel)'{-l,--logLevel}'[Set logging level (e.g. info, debug)]:value:' \
            '--debug[Enable debug output]'
          ;;
      esac
      ;;
  esac
}

_xyd "$@"
