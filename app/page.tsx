import Link from "next/link";
import styles from './styles/home.module.css';
import { instrumentSans } from './fonts';

export default function Home() {
  // Add your prototypes to this array
  const prototypes = [
    {
      title: 'Getting started',
      description: 'How to create a prototype',
      path: '/prototypes/example'
    },
    {
      title: 'Confetti button',
      description: 'An interactive button that creates a colorful confetti explosion',
      path: '/prototypes/confetti-button'
    },
    {
      title: 'Interactive eBook Reader',
      description: 'A modern, interactive ebook reader featuring Pride and Prejudice',
      path: '/prototypes/ebook-reader'
    },
    {
      title: 'RetroSynth',
      description: 'A pixel-art synthesizer with interactive keyboard and waveform visualization',
      path: '/prototypes/retro-synth'
    },
    {
      title: 'Logo Animation',
      description: 'An animated logo sequence with geometric transformations',
      path: '/prototypes/logo-animation'
    },
    {
      title: 'What Notion Agent are you?',
      description: 'A fun personality test to discover your Notion agent type',
      path: '/prototypes/personality-test'
    },
    // Add your new prototypes here like this:
    // {
    //   title: 'Your new prototype',
    //   description: 'A short description of what this prototype does',
    //   path: '/prototypes/my-new-prototype'
    // },
  ];

  return (
    <div className={`${styles.container} ${instrumentSans.className}`}>
      <div className={styles.shootingStar}></div>
      <header className={styles.header}>
        <h1>Madeleine's prototypes</h1>
      </header>

      <main>
        <section className={styles.grid}>
          {/* Goes through the prototypes list (array) to create cards */}
          {prototypes.map((prototype, index) => (
            <Link 
              key={index}
              href={prototype.path} 
              className={styles.card}
            >
              <h3>{prototype.title}</h3>
              <p>{prototype.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
