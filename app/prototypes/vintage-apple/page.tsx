import styles from './styles.module.css';

export default function VintageApplePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.rainbow}></div>
      </header>
      
      <main className={styles.main}>
        <h1 className={styles.title}>
          The power to
          be your best.
        </h1>
        
        <section className={styles.content}>
          <p className={styles.lead}>
            Macintosh™ is a powerful tool for people who want to achieve more in less time. 
            It's a personal computer that works the way you do.
          </p>
          
          <button className={styles.button}>
            Learn more about Macintosh →
          </button>
          
          <div className={styles.grid}>
            <div className={styles.card}>
              <h2>Easy to use</h2>
              <p>If you can point, you can use Macintosh. No complex commands to memorize.</p>
            </div>
            
            <div className={styles.card}>
              <h2>Built-in software</h2>
              <p>Everything you need to be productive, right out of the box.</p>
            </div>
            
            <div className={styles.card}>
              <h2>32-bit power</h2>
              <p>Sophisticated graphics and lightning-fast performance.</p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className={styles.footer}>
        © 1984 Apple Computer, Inc. Apple and the Apple logo are registered trademarks of Apple Computer, Inc.
      </footer>
    </div>
  );
} 