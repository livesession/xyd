# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "rooty"
  spec.version = "0.2.0"
  spec.summary = "Ruby client for the rooty CLI"
  spec.description = "Ruby client for the rooty CLI"
  spec.authors = ["opensdk"]
  spec.license = "MIT"
  spec.required_ruby_version = ">= 2.6.0"
  spec.files = Dir["lib/**/*.rb", "*.gemspec"]
  spec.require_paths = ["lib"]
end
