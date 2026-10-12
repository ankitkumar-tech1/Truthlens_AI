export interface PresetClaim {
  id: string;
  title: string;
  type: 'URL' | 'TEXT' | 'CLAIM';
  content: string;
  expectedCategory: 'Fake News / Conspiracy' | 'Verified News Report' | 'Clickbait / Unverified Claim';
  description: string;
}

export const PRESET_CLAIMS: PresetClaim[] = [
  {
    id: 'preset-1',
    title: '🚨 Fake Viral News: Alien Satellite Found Orbiting Moon',
    type: 'CLAIM',
    content: 'BREAKING: NASA scientists secretly confirm ancient alien satellite discovered orbiting the dark side of the Moon. Officials hiding data from public.',
    expectedCategory: 'Fake News / Conspiracy',
    description: 'Unsubstantiated viral space conspiracy claim without mainstream news or NASA verification.'
  },
  {
    id: 'preset-2',
    title: '✅ Verified News: James Webb Telescope Discoveries',
    type: 'URL',
    content: 'https://www.nasa.gov/missions/webb/nasa-webb-telescope-captures-deepest-view-of-universe/',
    expectedCategory: 'Verified News Report',
    description: 'Official NASA domain publication with valid SSL, transparent metadata, and peer-reviewed press release.'
  },
  {
    id: 'preset-3',
    title: '⚠️ Clickbait Health Claim: Secret Kitchen Herb Cures Diabetes In 3 Days',
    type: 'TEXT',
    content: 'SHOCKING SECRET! Doctors hate this one simple kitchen herb that completely cures type 2 diabetes overnight! Click now before big pharma removes this article!',
    expectedCategory: 'Clickbait / Unverified Claim',
    description: 'Classic clickbait medical disinformation with high sensationalism and zero medical backing.'
  },
  {
    id: 'preset-4',
    title: '📰 PolitiFact Fact-Check: Claim on Global Inflation Metrics',
    type: 'CLAIM',
    content: 'Claim: The US inflation rate reached its highest point in 100 years in 2024, surpassing 40% annually.',
    expectedCategory: 'Fake News / Conspiracy',
    description: 'Statistically false claim contradicting official Bureau of Labor Statistics and Federal Reserve public data.'
  }
];

export const PRESET_IMAGES = [
  {
    id: 'img-1',
    title: 'Photorealistic Synthetic Event (Midjourney v6)',
    filename: 'viral_breaking_explosion_event.jpg',
    source: 'Midjourney v6 Generated',
    description: 'AI generated image of a dramatic downtown street explosion with smooth plastic textures and extra hands.'
  },
  {
    id: 'img-2',
    title: 'Authentic Photo with Metadata',
    filename: 'official_press_conference_reuters.jpg',
    source: 'Canon EOS R5 RAW Export',
    description: 'Real news photograph with valid Canon EXIF lens tags and consistent light vectors.'
  }
];

export const PRESET_AUDIO = [
  {
    id: 'aud-1',
    title: 'Deepfake Voice Cloning of Political Figure',
    filename: 'executive_statement_cloned_voice.wav',
    duration: '18s',
    description: 'Synthesized voice using ElevenLabs clone model with zero natural breathing artifacts and robotic pitch step.'
  },
  {
    id: 'aud-2',
    title: 'Real Studio Radio Interview Recording',
    filename: 'bbc_radio_live_interview.mp3',
    duration: '24s',
    description: 'Authentic broadcast speech with natural mouth acoustics, room acoustic reverb, and organic micro-pauses.'
  }
];
