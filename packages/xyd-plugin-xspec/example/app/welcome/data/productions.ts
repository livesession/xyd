import { ProductionItem } from "../types";

// Sample grammar productions - expand with full data from your document
export const productions: ProductionItem[] = [
  {
    name: "AssignmentOperator",
    useGrid: true,
    columns: 5,
    gridItems: [
      "*=",
      "/=",
      "%=",
      "+=",
      "-=",
      "<<=",
      ">>=",
      ">>>=",
      "&=",
      "^=",
      "|=",
    ],
  },
  {
    name: "PBJ",
    alternatives: [
      ["Bread", "PeanutButter", "Jelly", "Bread"],
      ["Bread", "Jelly", "PeanutButter", "Bread"],
    ],
  },
  // Add more productions as needed...
];
