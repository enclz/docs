import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHero() {
  return (
    <header className={styles.heroBanner}>
      <div className={clsx('container', styles.heroContainer)}>
        <p className={styles.heroEyebrow}>Live on Solana Devnet</p>
        <h1 className={styles.heroTitle}>
          On-chain spend policy{' '}
          <span className={styles.heroAccent}>for agents.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Per-tx, daily, and recipient limits enforced by an Anchor program.
          Limits hold even if the backend is breached, the agent is
          prompt-injected, or its API key is leaked.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get started
          </Link>
          <Link
            className="button button--secondary button--lg"
            href="https://github.com/enclz/solana">
            View on GitHub
          </Link>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            Program <code>45PiBcnk…AFaLW</code>
          </span>
          <span className={styles.metaItem}>SKILL.md ready</span>
          <span className={styles.metaItem}>MCP · REST · Webhooks</span>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Enclz Docs"
      description="On-chain spend policy for AI agents on Solana. Per-tx, daily, and recipient limits enforced by an Anchor program — limits hold even if the backend is breached.">
      <HomepageHero />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
