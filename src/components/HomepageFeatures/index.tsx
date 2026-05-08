import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'On-chain enforcement',
    description: (
      <>
        Per-tx, daily, and hourly limits live on the <code>AgentWallet</code>{' '}
        PDA and are enforced inside the Anchor program. No backend can override
        them.
      </>
    ),
  },
  {
    title: 'TTL-bound recipient whitelist',
    description: (
      <>
        External recipients carry a TTL and an approved-amount cap. The{' '}
        <code>WhitelistEntry</code> PDA auto-closes on-chain when the cap is
        consumed.
      </>
    ),
  },
  {
    title: 'No private key for the agent',
    description: (
      <>
        Agents authenticate with a scoped API key. Limits hold even if the
        backend is breached, the agent is prompt-injected, or the API key is
        leaked.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
