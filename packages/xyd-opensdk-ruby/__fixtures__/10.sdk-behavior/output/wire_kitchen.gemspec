# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "wire_kitchen"
  spec.version = "0.3.0"
  spec.summary = "Ruby client for the Wire Kitchen API"
  spec.description = "Handcrafted IR exercising request encodings, header params and query serialization."
  spec.authors = ["opensdk"]
  spec.license = "MIT"
  spec.required_ruby_version = ">= 2.6.0"
  spec.files = Dir["lib/**/*.rb", "*.gemspec"]
  spec.require_paths = ["lib"]
end
