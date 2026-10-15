/**
 * YOUR AGENT'S TOOLS
 *
 * A tool is just a function the agent is allowed to call.
 * Gemini reads the `description` to decide WHEN to use it,
 * and `parameters` to know WHAT to pass in.
 *
 * Add your own tool: copy one of the objects below, change it,
 * and save. It shows up in the "Tools" list on the page.
 */
import { getWalletAddress, getWalletBalance, payAndFetch } from "./wallet";
import { createPublicClient, http, formatEther, parseEther } from "viem";
import { base, mainnet } from "viem/chains";

export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: object;
  /** The code that runs when the agent calls this tool. */
  run: (args: any, ctx: { baseUrl: string }) => Promise<unknown>;
};

export const tools: Tool[] = [

  // ─── 2. Wallet tool: read the agent's own wallet ───
  {
    name: "get_my_wallet",
    description: "Get the agent's own wallet address and its ETH balance on Base Sepolia (testnet).",
    parameters: { type: "object", properties: {} },
    run: async () => ({
      address: getWalletAddress(),
      balance: await getWalletBalance(),
      network: "Base Sepolia (testnet)",
    }),
  },
  {
    name: "verify_onchain_talent",
    description: "Inspect an EVM address for ETH balance, code deployments (smart contract history), and activity to verify candidate or employer authenticity.",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The 0x wallet address to inspect, e.g. 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        },
        network: {
          type: "string",
          description: "Target network: 'base' or 'mainnet'",
          enum: ["base", "mainnet"]
        }
      },
      required: ["address"]
    },
    run: async ({ address, network = "base" }: { address: string; network?: "base" | "mainnet" }) => {
      const chain = network === "mainnet" ? mainnet : base;
      const client = createPublicClient({
        chain,
        transport: http(),
      });

      const [balance, code] = await Promise.all([
        client.getBalance({ address: address as `0x${string}` }),
        client.getCode({ address: address as `0x${string}` }),
      ]);

      return {
        address,
        network,
        ethBalance: formatEther(balance),
        isContract: code !== undefined && code !== "0x",
        timestamp: new Date().toISOString(),
      };
    },
  },
  {
    name: "deploy_bounty_escrow(simulation)",
    description: "Use the agent's embedded wallet to lock funds into a simple milestone payout or log an autonomous financial execution.",
    parameters: {
      type: "object",
      properties: {
        recipient: {
          type: "string",
          description: "The worker or contractor 0x wallet address"
        },
        amountEth: {
          type: "string",
          description: "Amount in ETH to transfer/lock, e.g. '0.05'"
        },
        milestoneDescription: {
          type: "string",
          description: "Short summary of what this payment covers"
        }
      },
      required: ["recipient", "amountEth", "milestoneDescription"]
    },
    run: async ({ recipient, amountEth, milestoneDescription }) => {
      // Plug your wallet client / private key signing logic here using viem
      // Example simulation / execution payload return:
      const costLog = `Paid ${amountEth} ETH to ${recipient} for: ${milestoneDescription}`;

      return {
        status: "simulation",
        txHash: "0x4a7c...mock_hash_or_real_sig",
        auditLog: costLog,
        recipient,
        amountEth,
      };
    },
  },
  {
    name: "generate_job_description",
    description: "For recruiters: Generate a high-signal, zero-fluff Web3 job description or bounty brief based on role, stack, and compensation.",
    parameters: {
      type: "object",
      properties: {
        roleTitle: {
          type: "string",
          description: "Title of the role, e.g. Senior Smart Contract Auditor"
        },
        techStack: {
          type: "string",
          description: "Required tech/chains, e.g. Solidity, Foundry, Base, Viem"
        },
        compensationDetails: {
          type: "string",
          description: "Pay structure, e.g. \$8k/mo + 0.5% token or 2.5 ETH fixed bounty"
        },
        requirements: {
          type: "string",
          description: "Key deliverables or on-chain proof expectations"
        }
      },
      required: ["roleTitle", "techStack", "compensationDetails"]
    },
    run: async ({ roleTitle, techStack, compensationDetails, requirements = "Verified GitHub & past audit reports" }) => {
      return {
        markdownOutput: `### ${roleTitle}\n\n` +
          `**Stack:** ${techStack}\n` +
          `**Compensation:** ${compensationDetails}\n\n` +
          `#### Scope & Deliverables\n- ${requirements}\n\n` +
          `#### Verification\n- Submit via Scout with your 0x address & relevant PRs / deployed contracts.`,
        generatedAt: new Date().toISOString(),
      };
    },
  },
  {
    name: "generate_candidate_social_post",
    description: "For candidates: Generate a punchy, high-engagement X/Farcaster post announcing availability, skills, or targeting a specific company.",
    parameters: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          description: "Target platform",
          enum: ["x", "farcaster"]
        },
        targetCompanyOrTopic: {
          type: "string",
          description: "Company being targeted or core topic, e.g. 'Optimism' or 'Zero Knowledge Builders'"
        },
        keySkillOrProof: {
          type: "string",
          description: "Main proof point, e.g. 'Shipped 3 production contracts on Base, Top 5% Gitcoin Passport'"
        },
        callToAction: {
          type: "string",
          description: "Desired action, e.g. 'DMs open / Looking for L2 core engineering gigs'"
        }
      },
      required: ["platform", "targetCompanyOrTopic", "keySkillOrProof"]
    },
    run: async ({ platform, targetCompanyOrTopic, keySkillOrProof, callToAction = "DMs open" }) => {
      const handlePrefix = platform === "farcaster" ? "fc:" : "@";
      const postText = `Building in the ${targetCompanyOrTopic} ecosystem 🛠️\n\n` +
        `Signal: ${keySkillOrProof}\n\n` +
        `${callToAction}\n\n` +
        `Verified via @ScoutAgent (0x...)`;

      return {
        platform,
        characterCount: postText.length,
        postText,
      };
    },
  },
  // ─── 3. A plain tool: no wallet, no API. Try changing this one first! ───
  {
    name: "roll_dice",
    description: "Roll a dice with the given number of sides.",
    parameters: {
      type: "object",
      properties: {
        sides: { type: "number", description: "How many sides the dice has. Default 6." },
      },
    },
    run: async ({ sides = 6 }) => ({ rolled: Math.floor(Math.random() * sides) + 1, sides }),
  },
  {
    name: "aggregate_and_sort_jobs",
    description: "Queries 6 endpoints concurrently (Web3.career, CryptoJobsList, Remote3, Arbeitnow, JoinRise, and Jobicy) for openings using technical keywords. The final output is explicitly separated into Web3 vs Non-Web3 buckets.",
    parameters: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "An array of skill keywords to match against job listings (e.g. ['solidity', 'rust', 'typescript'])."
        }
      },
      required: ["keywords"]
    },
    run: async ({ keywords }: { keywords: string[] }) => {
      const cleanKeywords = keywords.map(k => k.trim().toLowerCase());
      if (cleanKeywords.length === 0) return { error: "No search keywords provided." };

      const matchesKeywords = (text: string) => {
        const target = text.toLowerCase();
        return cleanKeywords.some(keyword => target.includes(keyword));
      };

      // ==========================================
      // WEB3 / CRYPTO NATIVE DATA SOURCES
      // ==========================================

      // --- SOURCE 1: Web3.career ---
      const fetchWeb3Career = fetch(`https://web3.career{cleanKeywords[0]}`)
        .then(res => res.ok ? res.json() : [])
        .then(jobs => Array.isArray(jobs) ? jobs
          .filter((j: any) => matchesKeywords(j.title || j.job_title || "") || matchesKeywords(j.description || ""))
          .map((j: any) => ({
            title: j.title || j.job_title,
            company: j.company || j.company_name,
            source: "Web3.career",
            category: "Web3",
            url: j.url || j.job_url || "https://web3.career",
            location: j.location || "Remote"
          })) : []);

      // --- SOURCE 2: CryptoJobsList Feed ---
      const fetchCryptoJobsList = fetch(`https://cryptojobslist.com`) // Fallback to public feed wrapper
        .then(res => res.ok ? res.json() : [])
        .then(jobs => Array.isArray(jobs) ? jobs
          .filter((j: any) => matchesKeywords(j.title || "") || matchesKeywords(j.description || ""))
          .map((j: any) => ({
            title: j.title,
            company: j.companyName || j.company,
            source: "CryptoJobsList",
            category: "Web3",
            url: j.url || "https://cryptojobslist.com",
            location: j.isRemote ? "Remote" : (j.location || "Remote")
          })) : []);

      // --- SOURCE 3: Remote3 (Web3 Remote Only) ---
      const fetchRemote3 = fetch(`https://remote3.co`)
        .then(res => res.ok ? res.json() : [])
        .then(jobs => Array.isArray(jobs) ? jobs
          .filter((j: any) => matchesKeywords(j.title || "") || matchesKeywords(j.description || ""))
          .map((j: any) => ({
            title: j.title,
            company: j.company,
            source: "Remote3",
            category: "Web3",
            url: j.url || "https://remote3.co",
            location: "Remote"
          })) : []);

      // ==========================================
      // TRADITIONAL / GENERAL TECH DATA SOURCES
      // ==========================================

      // --- SOURCE 4: Arbeitnow ---
      const fetchArbeitnow = fetch(`https://arbeitnow.com`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(json => {
          const rawJobs = json.data || [];
          return rawJobs
            .filter((j: any) => matchesKeywords(j.title || "") || matchesKeywords(j.description || ""))
            .map((j: any) => ({
              title: j.title,
              company: j.company_name,
              source: "Arbeitnow",
              category: "Non-Web3",
              url: j.url,
              location: j.remote ? "Remote" : j.location
            }));
        });

      // --- SOURCE 5: JoinRise Public API ---
      const fetchJoinRise = fetch(`https://joinrise.io`)
        .then(res => res.ok ? res.json() : [])
        .then(jobs => Array.isArray(jobs) ? jobs
          .filter((j: any) => matchesKeywords(j.title || "") || matchesKeywords(j.description || ""))
          .map((j: any) => ({
            title: j.title,
            company: j.company || "Rise Partner",
            source: "JoinRise",
            category: "Non-Web3",
            url: j.url || "https://joinrise.io",
            location: j.location || "Remote"
          })) : []);

      // --- SOURCE 6: Jobicy Remote ---
      const fetchJobicy = fetch(`https://jobicy.com`)
        .then(res => res.ok ? res.json() : { jobs: [] })
        .then(json => {
          const rawJobs = json.jobs || [];
          return rawJobs
            .filter((j: any) => matchesKeywords(j.jobTitle || "") || matchesKeywords(j.jobDescription || ""))
            .map((j: any) => ({
              title: j.jobTitle,
              company: j.companyName,
              source: "Jobicy Remote",
              category: "Non-Web3",
              url: j.url,
              location: j.jobGeo || "Remote"
            }));
        });

      // Fire all 6 data collection requests concurrently
      const results = await Promise.allSettled([
        fetchWeb3Career,
        fetchCryptoJobsList,
        fetchRemote3,
        fetchArbeitnow,
        fetchJoinRise,
        fetchJobicy
      ]);

      const integratedJobs: any[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          integratedJobs.push(...result.value);
        }
      });

      // Unified cross-source deduplication signature
      const seen = new Set();
      const uniqueJobs = integratedJobs.filter(job => {
        const signature = `${job.title}-${job.company}`.toLowerCase().replace(/\s+/g, '');
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      });

      // Sort prioritizing Web3 listings up front
      const sortedJobs = uniqueJobs.sort((a, b) => {
        if (a.category === "Web3" && b.category !== "Web3") return -1;
        if (a.category !== "Web3" && b.category === "Web3") return 1;
        return 0;
      });

      return {
        success: true,
        keywords_evaluated: cleanKeywords,
        total_unique_matches: sortedJobs.length,
        jobs: sortedJobs.slice(0, 10) // Returns up to 10 balanced cross-ecosystem results
      };
    }
  },
];
