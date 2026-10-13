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
  // ─── 1. A paid API: the agent's wallet signs a payment to unlock it ───
  {
    name: "get_weather",
    description: "Get the current weather for a city. Costs 0.01 USDC, paid automatically from the agent's wallet.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name, e.g. Mumbai" },
      },
      required: ["city"],
    },
    run: async ({ city }, { baseUrl }) => {
      return payAndFetch(`${baseUrl}/api/weather?city=${encodeURIComponent(city)}`);
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
];
