export const STUDENT_RESOURCE_SECTIONS = [
  {
    id: "materials",
    title: "Materiais de aula",
    groups: [
      {
        id: "materials-1-2",
        title: "Encontros 1 e 2",
        items: [
          {
            id: "class-1-2",
            title: "Material da aula 1 e 2",
            href: "https://drive.google.com/file/d/1fWvpYy8qbm7QsnzeDpBuFhS8dTViupig/view?usp=sharing",
          },
        ],
      },
      {
        id: "materials-3-4",
        items: [
          {
            id: "class-3-4",
            title: "Material da aula 3 e 4",
            href: "https://material-de-aula.vercel.app",
          },
        ],
      },
    ],
  },
  {
    id: "curation",
    title: "Curadoria",
    groups: [
      {
        id: "curation-1-2",
        title: "Encontros 1 e 2",
        description: "Leituras e referências para aprofundar os temas dos dois primeiros encontros.",
        items: [
          {
            id: "cur-apple-gemini",
            title: "Apple fecha parceria com Google para levar o Gemini aos iPhones por meio da Siri",
            description: "g1",
            href: "https://g1.globo.com/tecnologia/noticia/2026/01/12/apple-fecha-parceria-com-google-para-integrar-o-gemini-a-siri.ghtml",
          },
          {
            id: "cur-wef-bargain",
            title: "AI has broken the internet's economic bargain – here's how we fix it",
            description: "World Economic Forum",
            href: "https://www.weforum.org/stories/2026/01/ai-has-broken-the-internet-s-economic-bargain-here-s-how-we-fix-it/",
          },
          {
            id: "cur-estonia",
            title: "Estonia bets on artificial intelligence to offset demographic decline",
            description: "Estonian World",
            href: "https://estonianworld.com/technology/estonia-bets-on-artificial-intelligence-to-offset-demographic-decline/",
          },
          {
            id: "cur-recall-copyright",
            title: "Researchers Just Found Something That Could Shake the AI Industry to its Core",
            description: "Futurism",
            href: "https://futurism.com/artificial-intelligence/ai-industry-recall-copyright-books",
          },
          {
            id: "cur-data-centers-br",
            title: "Dispara construção de data centers no Brasil mesmo sem incentivo fiscal",
            description: "UOL Tilt",
            href: "https://www.uol.com.br/tilt/noticias/redacao/2026/04/15/data-centers-devem-crescer-cinco-vez-no-brasil-mesmo-sem-incentivo-fiscal.ghtm",
          },
          {
            id: "cur-follow-money",
            title: "Follow the money",
            description: "Bloomberg",
            href: "https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals",
          },
          {
            id: "cur-circular-deals",
            title: "Efeitos piramidais e circulares",
            description: "Bloomberg",
            href: "https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals",
          },
          {
            id: "cur-androides",
            title: "Androides sonham com leitores de carne e osso?",
            description: "Folha",
            href: "https://www1.folha.uol.com.br/colunas/alexandra-moraes-ombudsman/2026/02/androides-sonham-com-leitores-de-carne-e-osso.shtml",
          },
          {
            id: "cur-moltbook",
            title: "Moltbook was peak AI theater",
            description: "Technology Review — busca sugerida",
            href: "https://www.technologyreview.com",
          },
          {
            id: "cur-claude-apocalypse",
            title: "The Only Thing Standing Between Humanity and AI Apocalypse Is… Claude?",
            description: "Wired",
            href: "https://www.wired.com/story/the-only-thing-standing-between-humanity-and-ai-apocalypse-is-claude/",
          },
          {
            id: "cur-block-jobs",
            title: "Jack Dorsey's Block cuts thousands of jobs as it embraces AI",
            description: "BBC",
            href: "https://www.bbc.com/news/articles/cq570d12y9do",
          },
          {
            id: "cur-pokemon-go",
            title: "Pokémon Go players built a 30-billion-photo map...",
            description: "MIT Technology Review",
            href: "https://www.technologyreview.com/2026/03/10/1134099/how-pokemon-go-is-helping-robots-deliver-pizza-on-time/",
          },
          {
            id: "cur-anthropic-risk",
            title: "Anthropic Hits Back After US Military Labels It a 'Supply Chain Risk'",
            description: "Wired",
            href: "https://www.wired.com/story/anthropic-supply-chain-risk-shockwaves-silicon-valley/",
          },
          {
            id: "cur-amazon-outages",
            title: "Amazon convenes 'deep dive' internal meeting to address outages",
            description: "CNBC",
            href: "https://www.cnbc.com/2026/03/10/amazon-plans-deep-dive-internal-meeting-address-ai-related-outages.html",
          },
          {
            id: "cur-roi-ai",
            title: "O ROI do uso de IA",
            description: "Wall Street Journal",
            href: "https://www.wsj.com/tech/ai/ai-tokens-productivity-d35c6bd8",
          },
        ],
      },
    ],
  },
];

export function getStudentResourcePreviewUrl(href = "") {
  if (!href) return "";
  try {
    const url = new URL(href);
    if (url.hostname.includes("drive.google.com")) {
      const match = href.match(/\/file\/d\/([^/]+)/);
      if (match?.[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return href;
  } catch {
    return href;
  }
}
