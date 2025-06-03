// This is a test file for the mdFunctionImport plugin
export function testFunction(): string {
  return 'Hello, world!';
}

// This is a region for testing
// #region testRegion
export function regionFunction(): string {
  return 'This is from a region';
}
// #endregion testRegion

// This is another region for testing
// #region anotherRegion
export function anotherRegionFunction(): string {
  return 'This is from another region';
}
// #endregion anotherRegion 