import { css } from "@linaria/core";

export const Footer = css`
  border-top: 1px solid var(--dark32);
  display: flex;
  align-items: center;
  flex-direction: column;

  p {
    color: var(--text-primary);
    font-weight: bold;
  }
  hr {
    background: var(--dark32);
    width: 100%;
    height: 1px;
  }

  a {
    color: var(--dark48);
    font-weight: var(--xyd-font-weight-medium);

    &:hover {
        color: var(--dark80);
    }
  }

  [part="container"] {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 3rem;
    justify-content: space-between;
    max-width: 1050px;
    width: 100%;

    padding: 100px 25px
  }

  [part="content"] {
    display: flex;
    flex-direction: row;
    gap: 32px;
    justify-content: space-between;
    width: 100%;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 24px;
    }
  }

  [part="first-column"] {
    display: flex;
    height: 24px;

    @media (min-width: 1024px) {
        min-width: 140px;
    }

    @media (max-width: 768px) {
        align-self: flex-start;
    }
  }

  [part="columns"] {
    display: grid;
    gap: 32px;
    grid-template-columns: repeat(auto-fill, minmax(0, 1fr));
    flex: 1 1 0%;

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
        width: 100%;
    }

    @media (max-width: 680px) {
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 20px;
    }

    &[data-cols="1"] {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    &[data-cols="2"] {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        
        @media (max-width: 680px) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
    }

    &[data-cols="3"] {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        
        @media (max-width: 768px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        
        @media (max-width: 680px) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
    }

    &[data-cols="4"] {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        
        @media (max-width: 768px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        
        @media (max-width: 680px) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
    }

    &[data-cols="5"] {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        
        @media (max-width: 768px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        
        @media (max-width: 680px) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
    }
  }

  [part="col"] {
    display: flex;
    flex-direction: column;
    align-items: center;
    white-space: nowrap;
    gap: 16px;

    @media (max-width: 768px) {
        align-items: flex-start;
        white-space: normal;
    }
  }

  [part="col-items"] {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;

    @media (max-width: 768px) {
        align-items: flex-start;
    }
  }

  [part="social-links"] {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    flex-wrap: wrap;
    max-width: 492px;
    min-width: 140px;

    @media (max-width: 768px) {
        justify-content: flex-start;
        max-width: 100%;
        min-width: auto;
    }

    svg {
        width: 24px;
        height: 24px;

        color: var(--dark48);
        fill: var(--dark48);

        &:hover {
            color: var(--dak80);
            fill: var(--dak80);
        }
    }
  }

  [part="footnote"] {
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }
  }
`;