import Link from "next/link";
import styles from './styles/home.module.css';
import { instrumentSans } from './fonts';

export default function Home() {
  // Only the personality test prototype
  const prototypes = [
    {
      title: 'What Notion Agent are you?',
      description: 'Answer 11 questions to reveal what Notion agent aligns most closely with your personality',
      path: '/prototypes/personality-test'
    },
  ];

  return (
    <div className={`${styles.container} ${instrumentSans.className}`}>
      <header className={styles.header}>
        <h1>Recently</h1>
      </header>

      <main>
        <div className={styles.list}>
          {prototypes.map((prototype, index) => (
            <Link 
              key={index}
              href={prototype.path} 
              className={styles.listItem}
            >
              <span className={styles.title}>{prototype.title}</span>
              <span className={styles.description}>{prototype.description}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
