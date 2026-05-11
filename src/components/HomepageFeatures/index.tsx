import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  label: string;
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    label: 'Enforcement',
    title: 'On-chain, not in middleware',
    description: (
      <>
        Per-tx, daily, and hourly limits live on the <code>AgentWallet</code>{' '}
        PDA. The Anchor program rejects anything outside policy — no backend
        override exists.
      </>
    ),
  },
  {
    label: 'Whitelist',
    title: 'TTL-bound recipients',
    description: (
      <>
        External recipients carry a TTL and an approved-amount cap. The{' '}
        <code>WhitelistEntry</code> PDA auto-closes on-chain when the cap is
        consumed.
      </>
    ),
  },
  {
    label: 'Blast radius',
    title: 'No private key for the agent',
    description: (
      <>
        Agents authenticate with a scoped API key. Limits hold even if the
        backend is breached, the agent is prompt-injected, or the key is
        leaked.
      </>
    ),
  },
];

function Feature({label, title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className={styles.featureCard}>
        <span className={styles.featureLabel}>{label}</span>
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props) => (
            <Feature key={props.label} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
