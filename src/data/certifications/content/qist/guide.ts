import type { DomainGuide } from '../../../aaismDomainGuide';

export const QIST_DOMAIN_GUIDES: DomainGuide[] = [
  {
    id: 1,
    shortName: 'PQC',
    name: 'Quantum Fundamentals & Post-Quantum Crypto',
    weight: '100%',
    overview:
      'QIST Domain 1 spans quantum computing fundamentals, quantum threats to classical cryptography, post-quantum algorithm families, NIST PQC standards, QKD basics, and enterprise migration planning. The exam tests practical security planning — not physics PhD depth.',
    learningObjectives: [
      'Explain qubits, superposition, and entanglement at security-relevant depth',
      'Describe how Shor and Grover algorithms threaten classical crypto',
      'Differentiate symmetric vs. asymmetric impacts and mitigation timelines',
      'Apply NIST PQC standards: CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+',
      'Plan harvest-now-decrypt-later (HNDL) risk mitigation strategies',
      'Evaluate QKD use cases, limitations, and integration with classical networks',
      'Execute crypto asset inventory and hybrid migration roadmaps',
      'Assess quantum readiness across TLS, VPN, code signing, and data at rest',
    ],
    coreConcepts: [
      {
        title: 'Qubits & Quantum Superposition',
        summary: 'Quantum bits exist in superposition — not simply 0 or 1 until measured.',
        detail:
          'A classical bit is 0 or 1. A qubit can be in a superposition state representing both simultaneously. N qubits represent 2^N states in superposition. Measurement collapses superposition to classical outcome. Decoherence limits practical computation time — qubits lose quantum state due to environmental noise.',
      },
      {
        title: 'Entanglement',
        summary: 'Correlated quantum states where measurement of one instantly affects the other.',
        detail:
          'Entangled qubits share quantum state regardless of distance. Enables quantum teleportation and QKD protocols. Not usable for faster-than-light communication — measurement outcomes are random. Foundation for quantum network security protocols.',
      },
      {
        title: 'Shor\'s Algorithm Threat',
        summary: 'Polynomial-time factorization and discrete log — breaks RSA, ECC, DH.',
        detail:
          'Shor\'s algorithm solves integer factorization and discrete logarithm on a sufficiently large fault-tolerant quantum computer. Threatens RSA, ECC (ECDSA, EdDSA), and Diffie-Hellman key exchange. Estimated need: millions of physical qubits with error correction for 2048-bit RSA. Timeline uncertain but migration must start now.',
      },
      {
        title: 'Grover\'s Algorithm Threat',
        summary: 'Quadratic speedup for unstructured search — halves symmetric key strength.',
        detail:
          'Grover reduces brute-force search from O(N) to O(√N). Effectively halves symmetric key security: AES-128 → 64-bit equivalent (inadequate), AES-256 → 128-bit equivalent (acceptable). SHA-256 preimage resistance similarly halved. Mitigation: double symmetric key lengths.',
      },
      {
        title: 'Harvest Now, Decrypt Later (HNDL)',
        summary: 'Adversaries collect encrypted data today to decrypt when quantum computers arrive.',
        detail:
          'Long-lived secrets (government archives, healthcare records, infrastructure keys) are at risk even before CRQC exists. Encrypted traffic intercepted today may be decrypted in 10–15 years. Prioritize PQC migration for data with long confidentiality requirements.',
      },
      {
        title: 'NIST PQC Standards (2024)',
        summary: 'CRYSTALS-Kyber (KEM), CRYSTALS-Dilithium (signatures), SPHINCS+ (hash-based sigs).',
        detail:
          'Kyber (ML-KEM): lattice-based key encapsulation — general encryption replacement. Dilithium (ML-DSA): lattice-based signatures — primary signature standard. SPHINCS+: hash-based signatures — backup for high-assurance scenarios. FALCON and BIKE remain under evaluation.',
      },
      {
        title: 'Post-Quantum Algorithm Families',
        summary: 'Lattice, hash-based, code-based, multivariate, and isogeny families.',
        detail:
          'Lattice-based (Kyber, Dilithium): most mature, good performance. Hash-based (SPHINCS+): conservative security assumptions. Code-based (Classic McEliece): large keys but long track record. Each family has different performance, key size, and security assumptions — hybrid deployments common during transition.',
      },
      {
        title: 'Hybrid Cryptography Migration',
        summary: 'Combine classical and PQC algorithms during transition period.',
        detail:
          'Hybrid TLS: classical ECDH + Kyber KEM in same handshake. If PQC broken, classical still protects. If quantum arrives, PQC protects. Google, Cloudflare deployed hybrid TLS experiments. Inventory all crypto usage before migration — TLS, VPN, email, code signing, disk encryption.',
      },
      {
        title: 'Quantum Key Distribution (QKD)',
        summary: 'Physics-based key exchange with eavesdropping detection — not general encryption.',
        detail:
          'QKD (BB84, E91 protocols) uses quantum properties to detect interception during key establishment. Provides information-theoretic security for key exchange only — still needs classical crypto for bulk encryption. Limited distance (~100-400km), requires dedicated fiber, not scalable like internet TLS. NIST does not standardize QKD as PQC replacement.',
      },
      {
        title: 'Crypto Agility & Inventory',
        summary: 'Ability to swap algorithms without full system redesign — requires planning.',
        detail:
          'Crypto inventory: catalog every use of RSA, ECC, AES, SHA across systems. CBOM (Cryptographic Bill of Materials). Prioritize by data sensitivity and lifespan. CBOM enables targeted migration. Hardcoded algorithms and fixed key sizes block agility.',
      },
      {
        title: 'Enterprise Migration Roadmap',
        summary: 'Phased PQC adoption aligned to NIST and NSA CNSA 2.0 timelines.',
        detail:
          'Phase 1: Inventory and risk assessment (now). Phase 2: Hybrid deployment for external TLS (2024–2026). Phase 3: Internal systems and code signing (2026–2028). Phase 4: Full PQC for long-lived data (2028–2030). NSA CNSA 2.0 mandates PQC for NSS by 2030–2035.',
      },
      {
        title: 'Quantum Random Number Generators',
        summary: 'QRNGs provide entropy from quantum measurement — stronger than PRNGs.',
        detail:
          'True randomness from quantum measurement uncertainty. Useful for key generation entropy sources. Distinct from QKD — QRNG provides random bits, not key distribution. Commercial QRNG devices available; validate against NIST SP 800-90B entropy standards.',
      },
    ],
    frameworks: [
      { name: 'NIST PQC Standardization', relevance: 'Kyber, Dilithium, SPHINCS+ standards', examWeight: 'high' },
      { name: 'NSA CNSA 2.0', relevance: 'US national security PQC migration timeline', examWeight: 'high' },
      { name: 'ETSI QKD Standards', relevance: 'QKD implementation and security proofs', examWeight: 'medium' },
      { name: 'NIST SP 800-208', relevance: 'Hybrid key exchange guidance', examWeight: 'medium' },
      { name: 'ISO/IEC 23837', relevance: 'QKD security requirements', examWeight: 'medium' },
      { name: 'CISA PQC Initiative', relevance: 'Federal and critical infrastructure guidance', examWeight: 'medium' },
    ],
    examPatterns: [
      {
        keyword: 'FIRST',
        prompt: 'An enterprise must address harvest-now-decrypt-later threats for classified archives.',
        answerLogic: 'FIRST = crypto asset inventory and prioritize PQC/hybrid migration for long-lived confidential data.',
      },
      {
        keyword: 'BEST',
        prompt: 'Which NIST PQC algorithm is BEST for general-purpose encryption replacement?',
        answerLogic: 'BEST = CRYSTALS-Kyber (ML-KEM) — lattice-based key encapsulation standard.',
      },
      {
        keyword: 'MOST',
        prompt: 'What symmetric key size is MOST appropriate for post-quantum environments?',
        answerLogic: 'MOST = AES-256 — maintains 128-bit security against Grover\'s algorithm.',
      },
      {
        keyword: 'LEAST',
        prompt: 'Which approach is LEAST effective as a standalone PQC migration strategy?',
        answerLogic: 'LEAST = waiting until commercial quantum computers are widely sold — HNDL risk exists today.',
      },
    ],
    trapAlerts: [
      {
        title: 'QKD Replaces PQC',
        trap: 'Selecting QKD as primary enterprise PQC migration strategy.',
        correctApproach: 'QKD supplements key exchange in specific scenarios; NIST PQC (Kyber/Dilithium) is the primary migration path.',
      },
      {
        title: 'AES-128 Is Fine',
        trap: 'Keeping AES-128 as sufficient post-quantum symmetric encryption.',
        correctApproach: 'Grover halves effective key strength — use AES-256 for quantum resistance.',
      },
      {
        title: 'Quantum Breaks Everything Now',
        trap: 'Believing all cryptography is broken by current quantum computers.',
        correctApproach: 'NISQ-era devices lack fault tolerance for Shor\'s algorithm at scale — but HNDL migration must start now.',
      },
      {
        title: 'Shor Threatens AES',
        trap: 'Selecting Shor\'s algorithm as threat to AES symmetric encryption.',
        correctApproach: 'Shor breaks RSA/ECC; Grover affects symmetric crypto — different algorithms, different threats.',
      },
    ],
    applyIt: {
      scenario:
        'A healthcare network stores patient records encrypted with RSA-2048 TLS for 25-year retention. Security team asks when to migrate.',
      orgAction:
        'Conduct crypto inventory, classify data by confidentiality lifespan, deploy hybrid TLS (ECDH + Kyber) for external connections immediately, plan internal system migration by 2027, document in CBOM, align to NSA CNSA 2.0 timeline for NSS components.',
    },
    relatedFeatures: [
      { label: 'Study Ops', route: '/study', description: 'PQC and quantum fundamentals questions' },
      { label: 'OSINT Arsenal', route: '/osint', description: 'NIST PQC, CISA, ETSI resources' },
      { label: 'Knowledge Visuals', route: '/knowledge/visual', description: 'Quantum threat and migration diagrams' },
      { label: 'Playbooks', route: '/playbooks', description: 'PQC migration planning guides' },
      { label: 'Scenario Lab', route: '/scenarios', description: 'Migration prioritization scenarios' },
      { label: 'Intel Hub', route: '/intel', description: 'Quantum computing progress tracking' },
    ],
  },
];
