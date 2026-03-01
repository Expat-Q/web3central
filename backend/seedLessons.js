const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lesson = require('./models/Lesson');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const lessons = [
    {
        id: 'intro-to-web3',
        slug: 'intro-to-web3',
        module: 'Web3 Foundations',
        title: 'The Institutional Shift to Web3',
        description: 'Understand the structural shift of decentralized networks and verifiable ownership.',
        level: 'Beginner',
        estimatedTime: '12 min',
        xpReward: 100,
        prerequisites: [],
        contentMarkdown: `
# The Institutional Shift to Web3

Web3 is not just about "crypto"; it is about **Verifiable Ownership** and **Permissionless Trust**. For the first time in history, we can coordinate global capital and data without central intermediaries.

## The Three Pillars
1. **Self-Sovereignty**: Users control their own data and assets via private keys.
2. **On-chain Logic**: Business logic is executed by Smart Contracts (immutable code).
3. **Decentralized Settlement**: Transactions are finalized by a global network of validators, not a bank.

## Why it Matters
In the traditional system, trust is "institutional" (you trust the legal system). In Web3, trust is "mathematical" (you trust the cryptography). This reduces friction, eliminates gatekeepers, and enables 24/7 global markets.
        `,
        quiz: {
            questions: [
                {
                    questionText: 'What is the fundamental difference between Web2 and Web3 trust models?',
                    options: [
                        'Web3 relies on faster servers',
                        'Web3 shifts trust from institutions to mathematical proofs',
                        'Web2 is more secure but slower',
                        'There is no difference'
                    ],
                    correctAnswerIndex: 1,
                    explanation: 'Web3 uses cryptography and decentralized ledgers to replace traditional institutional trust with mathematically verifiable state.'
                },
                {
                    questionText: 'What allows for "Verifiable Ownership" in Web3?',
                    options: [
                        'The government',
                        'Browser cookies',
                        'Private keys and public ledgers',
                        'Customer support'
                    ],
                    correctAnswerIndex: 2,
                    explanation: 'Your private key controls the assets recorded on the public ledger.'
                }
            ]
        }
    },
    {
        id: 'defi-architecture',
        slug: 'defi-architecture',
        module: 'DeFi Architecture',
        title: 'AMMs & Liquidity Cycles',
        description: 'Deep dive into Automated Market Makers (AMMs) and the mechanics of decentralized liquidity.',
        level: 'Intermediate',
        estimatedTime: '15 min',
        xpReward: 150,
        prerequisites: ['intro-to-web3'],
        contentMarkdown: `
# Understanding AMM Mechanics

Automated Market Makers (AMMs) like Uniswap replaced the Traditional "Order Book" with "Liquidity Pools."

## The Constant Product Formula
Most AMMs use the formula **x * y = k**.
- **x**: Amount of Token A
- **y**: Amount of Token B
- **k**: A constant value (the total liquidity)

When you buy Token A, you add Token B to the pool and remove Token A. To keep **k** constant, the price of Token A must increase. This is known as **Slippage**.

## The Role of Liquidity Providers (LPs)
LPs deposit assets into these pools to earn a portion of the trading fees. However, they face a unique risk called **Impermanent Loss**, which happens when the price of the assets deviates from the price at the time of deposit.
        `,
        quiz: {
            questions: [
                {
                    questionText: 'In the formula x * y = k, what happens to the price of Token x if a user adds a large amount of Token y to the pool?',
                    options: [
                        'The price of x decreases',
                        'The price of x increases',
                        'The price remains the same',
                        'The pool breaks'
                    ],
                    correctAnswerIndex: 1,
                    explanation: 'Because y increases, x must conceptually decrease in the pool to keep k constant, meaning the relative cost (price) of pulling x out has increased.'
                }
            ]
        }
    },
    {
        id: 'web3-security',
        slug: 'web3-security',
        module: 'Smart Contract Security',
        title: 'Private Key Hygiene & Phishing',
        description: 'Essential security practices for the decentralized world.',
        level: 'Beginner',
        estimatedTime: '10 min',
        xpReward: 100,
        prerequisites: [],
        contentMarkdown: `
# Sovereign Security

In Web3, you are your own bank. This means there is no "Forgot Password" button.

## The Hierarchy of Security
1. **Hardware Wallets**: (Ledger, Trezor) Keep keys offline. The "Gold Standard".
2. **Seed Phrase**: Never type this into a computer or take a screenshot. Write it on paper.
3. **Approval Management**: Many hacks happen because users sign "Infinite Approvals" to malicious sites. Use tools like Revoke.cash.

## Common Attack Vectors
- **Phishing**: Fake websites that look like real ones.
- **Clipboard Hacks**: Software that changes the address you copy-paste.
        `,
        quiz: {
            questions: [
                {
                    questionText: 'Which is the "Gold Standard" for securing high-value assets?',
                    options: [
                        'A screenshot of your seed phrase',
                        'A hardware wallet (offline storage)',
                        'Saving keys in a Cloud Drive',
                        'Sharing keys with a trusted friend'
                    ],
                    correctAnswerIndex: 1,
                    explanation: 'Hardware wallets keep your private keys entirely offline, protecting them from malware and keyloggers.'
                }
            ]
        }
    }
];

const seedLessons = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web3central');

        // Clear existing lessons
        await Lesson.deleteMany();

        // Insert new lessons
        await Lesson.insertMany(lessons);

        console.log('Lessons seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedLessons();
