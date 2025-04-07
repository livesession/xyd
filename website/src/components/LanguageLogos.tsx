import styles from './LanguageLogos.module.css';

interface LanguageLogo {
  src: string;
  alt: string;
  comingSoon?: boolean;
}

const logos: LanguageLogo[] = [
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd8ba0255383dcffd00_ts.svg",
    alt: "TypeScript"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd8ba0255383dcffd03_python.svg",
    alt: "Python"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd84e0e29a79de33caa_go.svg",
    alt: "Go"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd85ec190519e02afce_java.svg",
    alt: "Java"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd83cc8b9ea1f50f258_Ruby.svg",
    alt: "Ruby"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd85f15dea8b4b06577_net.svg",
    alt: ".NET"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd8760478a30e0a1839_php.svg",
    alt: "PHP"
  },
  {
    src: "https://cdn.prod.website-files.com/677dd0b17c7f7212ee5cb6a5/678d5cd8ecca737d906dc9d4_swift.svg",
    alt: "Swift",
    comingSoon: true
  },
  {
    src: "https://cdn.prod.website-files.com/67880ff570cdb1a85eee946f/678ecb95d35bf937fcf8cedc_rust.svg",
    alt: "Rust",
    comingSoon: true
  }
];

export function LanguageLogos() {
  return (
    <div className={styles.logoWrapper}>
      <div className={styles.logoContainer}>
        {logos.map((logo) => (
          <div key={logo.alt} className={styles.logoItem}>
            <img
              src={logo.src}
              alt={logo.alt}
              className={`${styles.languageLogo} ${logo.comingSoon ? styles.comingSoon : ''}`}
            />
            {logo.comingSoon && (
              <div className={styles.tooltip}>
                Coming soon
                <div className={styles.tooltipArrow} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 