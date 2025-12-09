import React from "react";

import type { ProductionItem } from "../types";

interface ProductionRuleProps {
  production: ProductionItem;
}

export function XSpecProductionRule({ production }: ProductionRuleProps) {
  if (production.useGrid && production.gridItems) {
    const columns = production.columns || 5;
    const rows: string[][] = [];

    for (let i = 0; i < production.gridItems.length; i += columns) {
      rows.push(production.gridItems.slice(i, i + columns));
    }

    return (
      <div className="spec-production" id={production.name}>
        <span className="spec-nt">
          <a href={`#${production.name}`} data-name={production.name}>
            {production.name}
          </a>
        </span>
        <div className="spec-oneof">
          <div className="spec-oneof-grid">
            <table>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((item, cellIndex) => (
                      <td key={cellIndex} className="spec-rhs">
                        <span className="spec-t">{item}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spec-production" id={production.name}>
      <span className="spec-nt">
        <a href={`#${production.name}`} data-name={production.name}>
          {production.name}
        </a>
      </span>
      {production.alternatives && production.alternatives.map((alt, altIndex) => (
        <div key={altIndex} className="spec-rhs">
          {alt.map((token, tokenIndex) => (
            <span key={tokenIndex} className="spec-nt">
              <span data-name={token}>{token}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
