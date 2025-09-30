import React from "react";

import { MDXCommonAtlasProps } from "./types";
import { AtlasDecorator } from "./AtlasDecorator";
import { AtlasPrimary } from "./AtlasPrimary";
import { AtlasSecondary } from "./AtlasSecondary";

import * as cn from "./Atlas.styles";
import { UXAnalytics } from "openux-js";

interface AtlasProps<T> extends MDXCommonAtlasProps<T> {
  kind: "secondary" | "primary" | undefined | null;
  analytics?: boolean;
}

const noopAnalytics = {
  track: () => {},
};

export function Atlas<T>(props: AtlasProps<T>) {
  let AtlasComponent: React.FC<MDXCommonAtlasProps<T>>;

  if (props.kind === "secondary") {
    AtlasComponent = AtlasSecondary;
  } else {
    AtlasComponent = AtlasPrimary;
  }

  let references = props.references;
  {
    // TODO: find better solution - if we pass from md then its string
    if (references && typeof references === "string") {
      // TODO: DO IT BETTER
      try {
        references = JSON.parse(references);
      } catch (error) {
        console.error("Error parsing references", error);
      }
    }
  }

  // TODO: temporary, remove when we will have proper analytics
  const Wrapper = props.analytics ? UXAnalytics : React.Fragment;
  
  return (
    <Wrapper analytics={noopAnalytics}>
      <AtlasDecorator>
        <div className={cn.AtlasHost}>
          <AtlasComponent
            references={references}
            apiRefItemKind={props.apiRefItemKind}
          />
        </div>
      </AtlasDecorator>
    </Wrapper>
  );
}
