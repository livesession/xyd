import {css} from "@linaria/core";

const example = css`
  color: red;
`;

interface Abc {

}

export const Example = () => {
  return <div className={example}>Example</div>;
};