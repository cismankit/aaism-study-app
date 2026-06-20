import type { DomainGuide } from '../../../aaismDomainGuide';

export const CBSP_DOMAIN_GUIDES: DomainGuide[] = [
  {
    id: 1,
    shortName: 'Fundamentals',
    name: 'Blockchain Fundamentals',
    weight: '25%',
    overview:
      'Domain 1 establishes cryptographic foundations, ledger architecture, and consensus primitives that underpin all blockchain security decisions. CBSP tests whether you understand why immutability, decentralization, and transparency create both security properties and novel attack surfaces.',
    learningObjectives: [
      'Explain hash functions, Merkle trees, and digital signatures in blockchain context',
      'Differentiate public, private, consortium, and hybrid blockchain architectures',
      'Compare account-based (Ethereum) vs. UTXO (Bitcoin) transaction models',
      'Evaluate trade-offs between decentralization, scalability, and security',
      'Identify common blockchain components: nodes, wallets, miners/validators, oracles',
      'Assess immutability limits and fork scenarios affecting audit integrity',
      'Map blockchain layers: L1 base chain, L2 scaling, bridges, and sidechains',
    ],
    coreConcepts: [
      {
        title: 'Cryptographic Building Blocks',
        summary: 'Hash functions, digital signatures, and Merkle trees secure the ledger.',
        detail:
          'SHA-256 hashes link blocks immutably — altering history breaks hash chains. ECDSA/EdDSA signatures prove transaction authorization. Merkle trees enable efficient block verification and light client proofs. Weak randomness or broken hash functions undermine entire chains.',
      },
      {
        title: 'Distributed Ledger Architecture',
        summary: 'Replicated state across nodes with consensus on valid transitions.',
        detail:
          'Each node maintains a copy of state. Transactions propose state changes; consensus determines ordering and validity. Full nodes validate everything; light clients trust headers and Merkle proofs. Node compromise affects local view but not global consensus if majority honest.',
      },
      {
        title: 'UTXO vs. Account Model',
        summary: 'Bitcoin UTXO tracks unspent outputs; Ethereum accounts hold balances and code.',
        detail:
          'UTXO: transactions consume inputs and create outputs — no account balance field. Account model: addresses hold balances and smart contract code. Account model enables composable DeFi but introduces reentrancy and storage collision risks in contracts.',
      },
      {
        title: 'Public vs. Private Blockchains',
        summary: 'Permissionless open participation vs. permissioned enterprise networks.',
        detail:
          'Public chains (Bitcoin, Ethereum): anyone can validate/transact; security from economic incentives and decentralization. Private/consortium: known validators; faster but trust assumptions differ. Enterprise security focuses on access control and node hardening rather than 51% economics.',
      },
      {
        title: 'Immutability & Forks',
        summary: 'History is costly to rewrite; forks create temporary or permanent divergence.',
        detail:
          'Immutability is probabilistic and economic — 51% attacks can rewrite recent history. Soft forks tighten rules; hard forks change protocol. Reorgs reorder recent blocks. Longest-chain rule (PoW) or fork choice rule (PoS) resolves conflicts. Audit integrity depends on finality assumptions.',
      },
      {
        title: 'Layer Architecture (L1/L2/Bridges)',
        summary: 'Scaling layers and bridges introduce new trust and security boundaries.',
        detail:
          'L1: base consensus layer (Ethereum, Bitcoin). L2: rollups (Optimistic, ZK) batch transactions off-chain. Bridges connect chains — often the weakest security link. Bridge attacks have caused billions in losses; understand custodial vs. trustless bridge models.',
      },
      {
        title: 'Nodes & Network Topology',
        summary: 'Full, light, archive, and validator nodes with distinct security roles.',
        detail:
          'Validators propose/attest blocks in PoS. Full nodes validate all transactions. Archive nodes store full history. RPC nodes expose APIs — often targeted for DDoS and must be hardened. Eclipse attacks isolate nodes from honest network.',
      },
      {
        title: 'Oracles & External Data',
        summary: 'Blockchains cannot natively access off-chain data — oracles bridge the gap.',
        detail:
          'Price feeds, weather data, and identity proofs enter via oracles. Centralized oracles are single points of failure. Chainlink and similar use aggregation and staking. Oracle manipulation is a top DeFi attack vector — never trust a single price source.',
      },
    ],
    frameworks: [
      { name: 'NIST Blockchain Technology Overview', relevance: 'Foundational architecture and security properties', examWeight: 'high' },
      { name: 'BSI Blockchain Security Guidelines', relevance: 'Enterprise blockchain security baseline', examWeight: 'medium' },
      { name: 'Ethereum Yellow Paper', relevance: 'Account model and EVM fundamentals', examWeight: 'medium' },
      { name: 'Bitcoin Whitepaper', relevance: 'UTXO model and PoW consensus', examWeight: 'medium' },
      { name: 'OWASP Smart Contract Top 10', relevance: 'Cross-domain vulnerability context', examWeight: 'low' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'An enterprise evaluates blockchain for supply chain audit trails.',
        answerLogic: 'FIRST = assess whether decentralization benefits exceed operational complexity — not deploy immediately.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which property MOST supports tamper-evident transaction history?',
        answerLogic: 'BEST = cryptographic hash chaining making alterations detectable.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST significant security risk when bridging assets between L1 and L2?',
        answerLogic: 'MOST = bridge custody or validation flaws enabling unauthorized minting or theft.',
      },
    ],
    trapAlerts: [
      {
        title: 'Immutability as Absolute',
        trap: 'Believing blockchain history can never be altered under any circumstance.',
        correctApproach: 'Immutability is economic and probabilistic — 51% attacks and hard forks can rewrite history.',
      },
      {
        title: 'Blockchain Solves All Trust',
        trap: 'Selecting blockchain when a centralized database with audit logs suffices.',
        correctApproach: 'Blockchain adds value when decentralization, censorship resistance, or multi-party trust is required.',
      },
      {
        title: 'L2 Equals L1 Security',
        trap: 'Assuming L2 rollups have identical security to L1 without understanding bridge assumptions.',
        correctApproach: 'L2 security depends on rollup type, sequencer honesty, and bridge design.',
      },
    ],
    applyIt: {
      scenario:
        'A logistics firm wants immutable shipment records shared across carriers, customs, and insurers without a single trusted intermediary.',
      orgAction:
        'Evaluate consortium blockchain with known validators, define data visibility per party, assess finality requirements, and model bridge risks if integrating with public chain settlement.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Fundamentals practice questions' },
      { label: 'Knowledge Visuals', route: '/knowledge/visual', description: 'Blockchain architecture diagrams' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'Blockchain research and standards' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Architecture decision scenarios' },
      { label: 'Intel Hub', route: '/intel', description: 'Blockchain security trends' },
    ],
  },
  {
    id: 2,
    shortName: 'Contracts',
    name: 'Smart Contract Security',
    weight: '25%',
    overview:
      'Domain 2 is the highest-impact CBSP area — vulnerabilities in immutable code cause irreversible financial loss. You must know OWASP Smart Contract Top 10, common exploit patterns, and secure development practices for Solidity/Vyper contracts.',
    learningObjectives: [
      'Identify reentrancy, integer overflow, access control, and logic bugs',
      'Apply checks-effects-interactions pattern and secure state management',
      'Evaluate DeFi-specific risks: flash loans, oracle manipulation, liquidity attacks',
      'Conduct static analysis, fuzzing, and formal verification for contracts',
      'Design upgradeable contracts with secure proxy patterns',
      'Implement secure token standards (ERC-20, ERC-721) without common flaws',
      'Plan incident response for immutable on-chain exploits',
    ],
    coreConcepts: [
      {
        title: 'Reentrancy Attacks',
        summary: 'External calls before state updates enable recursive draining.',
        detail:
          'Classic DAO hack: attacker re-enters withdraw function before balance updated. Checks-Effects-Interactions: update state before external calls. Reentrancy guards (mutex locks) add defense. Read-only reentrancy affects view functions used as oracles.',
      },
      {
        title: 'Access Control Flaws',
        summary: 'Missing or incorrect permission checks on privileged functions.',
        detail:
          'Functions like mint, withdraw, upgrade must restrict callers. Use OpenZeppelin Ownable/AccessControl. tx.origin authentication is vulnerable to phishing. Default public functions in Solidity are callable by anyone.',
      },
      {
        title: 'Integer Overflow/Underflow',
        summary: 'Arithmetic errors in pre-0.8 Solidity or unchecked blocks.',
        detail:
          'Solidity 0.8+ has built-in overflow checks. unchecked blocks bypass them — use only when provably safe. Precision loss in fixed-point math affects DeFi pricing. Use SafeMath libraries in legacy contracts.',
      },
      {
        title: 'Oracle Manipulation',
        summary: 'Single-source price feeds enable flash-loan driven attacks.',
        detail:
          'Attackers manipulate DEX spot prices via flash loans, then exploit protocols using that price. Use Chainlink TWAP, multiple sources, circuit breakers. Never use spot price from low-liquidity pools as sole oracle.',
      },
      {
        title: 'Flash Loan Attacks',
        summary: 'Uncollateralized loans within one transaction enable capital-free exploits.',
        detail:
          'Borrow millions, manipulate markets, profit, repay in single tx. Protocols must not assume users hold assets across transactions. Design for atomic transaction boundaries — state must be consistent after each tx.',
      },
      {
        title: 'Upgradeable Proxy Patterns',
        summary: 'Proxies enable logic upgrades while preserving storage — storage collision risk.',
        detail:
          'Transparent proxy, UUPS, beacon patterns. Storage layout must remain compatible across upgrades. Uninitialized proxy vulnerability: attacker initializes proxy before legitimate deployer. Always initialize in constructor or use initializer modifier with protection.',
      },
      {
        title: 'Secure Development & Testing',
        summary: 'Static analysis, fuzzing, formal verification, and peer review before mainnet.',
        detail:
          'Tools: Slither, Mythril, Echidna, Certora. Test on forks of mainnet state. Bug bounties pre-launch. Never deploy untested code with real funds. Consider timelocks on admin functions.',
      },
      {
        title: 'Token Standard Pitfalls',
        summary: 'ERC-20 approve race, ERC-721 callback reentrancy, fee-on-transfer tokens.',
        detail:
          'ERC-20: check return values — not all tokens return bool. Fee-on-transfer tokens break balance assumptions. ERC-721 onERC721Received callback enables reentrancy. Always use safe transfer patterns.',
      },
    ],
    frameworks: [
      { name: 'OWASP Smart Contract Top 10', relevance: 'Primary vulnerability taxonomy', examWeight: 'high' },
      { name: 'SWC Registry', relevance: 'Smart Contract Weakness Classification', examWeight: 'high' },
      { name: 'Consensys Smart Contract Best Practices', relevance: 'Development security guidelines', examWeight: 'high' },
      { name: 'OpenZeppelin Contracts', relevance: 'Audited secure contract libraries', examWeight: 'medium' },
      { name: 'Ethereum Smart Contract Security Best Practices', relevance: 'Community security standards', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'A DeFi contract loses funds via recursive external calls before balance updates.',
        answerLogic: 'FIRST = reentrancy — apply checks-effects-interactions and reentrancy guard.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which control BEST mitigates oracle manipulation in a lending protocol?',
        answerLogic: 'BEST = decentralized oracle with TWAP, multiple sources, and circuit breakers.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST critical step before deploying a contract holding user funds?',
        answerLogic: 'MOST = professional audit, fuzzing, and testnet validation with bug bounty.',
      },
    ],
    trapAlerts: [
      {
        title: 'Spot Price as Oracle',
        trap: 'Using DEX spot price from a single low-liquidity pool.',
        correctApproach: 'Use TWAP, Chainlink, or aggregated feeds with manipulation resistance.',
      },
      {
        title: 'Upgrade Without Storage Layout',
        trap: 'Upgrading proxy logic without preserving storage layout compatibility.',
        correctApproach: 'Map storage slots explicitly; test upgrades on forked mainnet state.',
      },
      {
        title: 'tx.origin Authentication',
        trap: 'Using tx.origin for access control instead of msg.sender.',
        correctApproach: 'tx.origin is vulnerable to phishing via intermediary contracts.',
      },
    ],
    applyIt: {
      scenario:
        'Your team deploys a lending protocol using a single DEX pool price for collateral valuation. A flash loan attack drains $2M in one transaction.',
      orgAction:
        'Post-mortem: replace spot oracle with Chainlink TWAP, add circuit breakers on large price swings, implement checks-effects-interactions on all external calls, schedule professional audit before redeployment.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Smart contract security questions' },
      { label: 'Playbooks', route: '/playbooks', description: 'Secure contract development guides' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'SWC, OWASP, audit tools' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'DeFi exploit scenarios' },
      { label: 'Intel Hub', route: '/intel', description: 'Recent contract exploit patterns' },
    ],
  },
  {
    id: 3,
    shortName: 'Consensus',
    name: 'Consensus & Network Security',
    weight: '25%',
    overview:
      'Domain 3 covers proof-of-work, proof-of-stake, validator security, network-layer attacks, and fork scenarios. CBSP tests understanding of how consensus mechanisms create security guarantees and their failure modes.',
    learningObjectives: [
      'Compare PoW, PoS, and hybrid consensus security models',
      'Analyze 51% attacks, selfish mining, and long-range attacks',
      'Secure validator nodes: key management, DDoS protection, slashing avoidance',
      'Identify eclipse, Sybil, and routing attacks on blockchain networks',
      'Evaluate finality guarantees and reorg risks for application design',
      'Assess MEV (Maximal Extractable Value) risks and mitigation',
      'Design network segmentation and monitoring for blockchain infrastructure',
    ],
    coreConcepts: [
      {
        title: 'Proof of Work (PoW)',
        summary: 'Security from computational cost of block production.',
        detail:
          'Miners compete to solve hash puzzles; longest chain wins. 51% attack: majority hash power reorders blocks and double-spends. Selfish mining withholds blocks to gain advantage. Energy cost is security budget. Bitcoin targets 10-minute blocks.',
      },
      {
        title: 'Proof of Stake (PoS)',
        summary: 'Validators stake economic value; misbehavior is penalized via slashing.',
        detail:
          'Ethereum PoS: validators propose and attest blocks. Slashing punishes double-signing and surround voting. Nothing-at-stake and long-range attacks are theoretical risks mitigated by checkpointing. Validator keys must be secured — compromised keys enable slashing.',
      },
      {
        title: '51% / Majority Attacks',
        summary: 'Controlling consensus majority enables block reordering and double-spend.',
        detail:
          'PoW: majority hash power. PoS: majority stake (harder on large networks). Attacks target recent blocks before deep confirmation. Exchanges wait for N confirmations based on chain security. Smaller chains are more vulnerable.',
      },
      {
        title: 'Eclipse & Sybil Attacks',
        summary: 'Isolating nodes from honest network or flooding with fake identities.',
        detail:
          'Eclipse: attacker controls all peer connections of a victim node, feeding false chain state. Sybil: many fake nodes to gain influence in peer selection. Mitigation: diverse peer selection, authenticated peer lists, VPN overlays for validators.',
      },
      {
        title: 'Finality & Reorgs',
        summary: 'Probabilistic vs. absolute finality affects application security assumptions.',
        detail:
          'Bitcoin: probabilistic finality — deeper blocks harder to reverse. Ethereum PoS: checkpoint finality after 2 epochs (~13 min). Reorgs reorder recent transactions. Apps must handle chain reorganization events — do not assume instant finality.',
      },
      {
        title: 'Validator Node Security',
        summary: 'Validators are high-value targets — compromise enables slashing and network harm.',
        detail:
          'Harden validator infrastructure: dedicated hardware, network isolation, DDoS protection, redundant failover. Separate signing keys from hot operation keys where possible. Monitor for double-sign attempts. Geographic distribution reduces correlated failure.',
      },
      {
        title: 'MEV & Transaction Ordering',
        summary: 'Block producers can extract value by reordering, inserting, or censoring transactions.',
        detail:
          'Front-running, sandwich attacks, and liquidations generate MEV. Flashbots and PBS (proposer-builder separation) mitigate some risks. Users face worse execution prices. DApps should design for MEV-aware transaction submission.',
      },
      {
        title: 'DDoS & RPC Layer Attacks',
        summary: 'Public RPC endpoints and nodes are DDoS targets affecting availability.',
        detail:
          'Rate limiting, CDN protection, and redundant RPC providers maintain availability. Validators should not expose signing endpoints publicly. Separate public RPC from validator infrastructure.',
      },
    ],
    frameworks: [
      { name: 'Ethereum PoS Specifications', relevance: 'Validator roles and slashing conditions', examWeight: 'high' },
      { name: 'Bitcoin Security Model', relevance: 'PoW economics and 51% analysis', examWeight: 'high' },
      { name: 'NIST Blockchain Security', relevance: 'Network-layer threat catalog', examWeight: 'medium' },
      { name: 'Flashbots MEV Research', relevance: 'MEV risks and mitigation', examWeight: 'medium' },
      { name: 'CIS Blockchain Benchmarks', relevance: 'Node hardening guidelines', examWeight: 'low' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'An attacker controls majority hash power on a PoW chain.',
        answerLogic: 'FIRST = can reorder recent blocks and double-spend — not decrypt private keys.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which practice BEST secures an Ethereum validator node?',
        answerLogic: 'BEST = isolated infrastructure, protected signing keys, DDoS mitigation, monitoring for slashing.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST significant risk of eclipse attacking a full node?',
        answerLogic: 'MOST = feeding false chain state, enabling double-spend acceptance by victim.',
      },
    ],
    trapAlerts: [
      {
        title: '51% Decrypts Keys',
        trap: 'Believing majority control enables decryption of wallet private keys.',
        correctApproach: '51% enables reordering and double-spend — not breaking ECDSA cryptography.',
      },
      {
        title: 'Instant Finality Assumption',
        trap: 'Designing apps that assume transactions are final immediately.',
        correctApproach: 'Wait for sufficient confirmations or checkpoint finality based on chain.',
      },
      {
        title: 'Validator on Public RPC',
        trap: 'Running validator signing on same host as public RPC endpoint.',
        correctApproach: 'Isolate validator infrastructure; never expose signing keys to public network.',
      },
    ],
    applyIt: {
      scenario:
        'Your exchange lists a new PoW altcoin with low hash rate. An attacker 51% attacks and deposits, trades, withdraws on another chain, then reorgs the deposit.',
      orgAction:
        'Increase confirmation requirements proportional to chain security, monitor hash rate, consider delisting if security budget insufficient, implement deposit delay matching reorg depth risk.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Consensus security questions' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'Consensus research and specs' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Network attack scenarios' },
      { label: 'Intel Hub', route: '/intel', description: '51% attack and MEV trends' },
      { label: 'Playbooks', route: '/playbooks', description: 'Validator hardening guides' },
    ],
  },
  {
    id: 4,
    shortName: 'Keys',
    name: 'Wallet & Key Management',
    weight: '25%',
    overview:
      'Domain 4 covers cryptographic key lifecycle — generation, storage, backup, rotation, and recovery. CBSP emphasizes that most blockchain losses stem from key compromise, not protocol breaks. Custody architecture is critical.',
    learningObjectives: [
      'Differentiate hot, warm, and cold wallet architectures',
      'Implement HSM and MPC-based key custody for enterprise',
      'Design secure backup and recovery procedures (seed phrases, Shamir shares)',
      'Apply multi-signature and threshold signature schemes',
      'Prevent phishing, clipboard hijacking, and social engineering targeting keys',
      'Manage key rotation and employee offboarding for organizational wallets',
      'Evaluate custodial vs. self-custody trade-offs for different asset classes',
    ],
    coreConcepts: [
      {
        title: 'Hot, Warm, and Cold Wallets',
        summary: 'Online-connected vs. air-gapped storage tiers based on access frequency.',
        detail:
          'Hot wallets: online, for frequent transactions — highest risk. Warm: limited connectivity, operational buffer. Cold: air-gapped, offline generation — for treasury reserves. Never store treasury keys in hot wallets or shared channels.',
      },
      {
        title: 'HSM Key Custody',
        summary: 'Hardware Security Modules protect keys in tamper-resistant hardware.',
        detail:
          'Keys never leave HSM in plaintext. FIPS 140-2/3 validated devices. Cloud HSM (AWS CloudHSM, Azure Dedicated HSM) for enterprise. Signing operations occur inside HSM. HSM compromise requires physical access or firmware exploit.',
      },
      {
        title: 'Multi-Party Computation (MPC)',
        summary: 'Distributed key shares enable signing without reconstructing full key.',
        detail:
          'MPC wallets split key across parties/devices — no single point of compromise. Threshold signing: M-of-N shares required. Fireblocks, Coinbase Custody use MPC. Different trust model than multisig on-chain.',
      },
      {
        title: 'Multi-Signature Wallets',
        summary: 'On-chain M-of-N signature requirement for transaction authorization.',
        detail:
          'Gnosis Safe popular for treasury. 2-of-3 or 3-of-5 common for corporate treasury. Multisig is on-chain visible — different privacy than MPC. Smart contract multisig adds gas cost but enables policy logic.',
      },
      {
        title: 'Seed Phrase & Backup Security',
        summary: 'BIP-39 mnemonic phrases must never be stored digitally in plaintext.',
        detail:
          '12/24 word seeds recover full wallet. Never in Slack, email, cloud photos, or password managers without encryption. Shamir Secret Sharing splits seed across locations. Metal backups for fire/water resistance. Test recovery procedures.',
      },
      {
        title: 'Phishing & Social Engineering',
        summary: 'Most key theft is social — fake sites, support scams, clipboard malware.',
        detail:
          'Verify URLs, use hardware wallet screens for address confirmation. Clipboard hijackers replace pasted addresses. Fake wallet apps and seed phrase entry forms. Employee training on crypto-specific phishing.',
      },
      {
        title: 'Key Rotation & Offboarding',
        summary: 'Organizational wallet access must change when personnel change.',
        detail:
          'Rotate keys when employees with access leave. Multisig allows removing compromised signer. Document key ceremony procedures. Audit who holds which shares. Time-locked recovery for lost signer scenarios.',
      },
      {
        title: 'Custodial vs. Self-Custody',
        summary: 'Trade-off between convenience and "not your keys, not your coins."',
        detail:
          'Custodial (exchange custody): counterparty risk, regulatory clarity, insurance. Self-custody: full control, full responsibility. Enterprise treasury often uses qualified custodians for compliance. Retail users face recovery burden.',
      },
    ],
    frameworks: [
      { name: 'NIST SP 800-57', relevance: 'Key management lifecycle guidance', examWeight: 'high' },
      { name: 'BIP-32/39/44', relevance: 'HD wallets and mnemonic standards', examWeight: 'high' },
      { name: 'FIPS 140-2/3', relevance: 'HSM validation levels', examWeight: 'medium' },
      { name: 'SOC 2 for Custodians', relevance: 'Custodial service audit standards', examWeight: 'medium' },
      { name: 'CCSS (Crypto Currency Security Standard)', relevance: 'Industry custody security standard', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'A startup stores hot wallet private keys in a shared Slack channel.',
        answerLogic: 'FIRST = move to HSM or MPC custody with role-based access — immediate remediation.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which approach BEST secures enterprise treasury holding $50M in crypto?',
        answerLogic: 'BEST = cold/MPC custody with multisig policy, HSM signing, and audited procedures.',
      },
      {
        keyword: 'MOST',
        prompt: 'What is the MOST common cause of cryptocurrency theft?',
        answerLogic: 'MOST = key compromise via phishing, poor storage, or social engineering — not protocol breaks.',
      },
    ],
    trapAlerts: [
      {
        title: 'Keys in Chat/Email',
        trap: 'Storing or sharing keys via Slack, email, or cloud docs.',
        correctApproach: 'HSM, MPC, or hardware wallet — never plaintext digital storage.',
      },
      {
        title: 'Single Signer Treasury',
        trap: 'One person holds sole key to organizational treasury.',
        correctApproach: 'Multisig or MPC with M-of-N policy and documented ceremonies.',
      },
      {
        title: 'Skip Recovery Testing',
        trap: 'Backing up seed phrase without ever testing recovery.',
        correctApproach: 'Regular recovery drills prove backup integrity before crisis.',
      },
    ],
    applyIt: {
      scenario:
        'A DeFi protocol treasury holds $20M across a hot operational wallet and cold reserves. A developer with hot wallet access is phished.',
      orgAction:
        'Immediately rotate hot wallet keys, move excess to cold, implement MPC for operational wallet, add multisig for treasury transfers >$100K, conduct phishing post-mortem training, audit all key holders.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'Key management questions' },
      { label: 'Playbooks', route: '/playbooks', description: 'Custody implementation guides' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'HSM, MPC, BIP standards' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Custody decision scenarios' },
      { label: 'Intel Hub', route: '/intel', description: 'Wallet exploit trends' },
    ],
  },
];
