import { Bot, Calendar, Lightbulb, Network, Users, UserPlus, Presentation, Trophy, FileText, MapPin, Coffee, Code, MessageSquare, CheckCircle, Eye, Mic, Award, Briefcase, Leaf, Cpu, Music, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InfiniteScrollPromptsProps {
  onPromptSelect: (prompt: string) => void;
}

interface Prompt {
  icon: LucideIcon;
  textKey: string;
  category: string;
}

const InfiniteScrollPrompts = ({ onPromptSelect }: InfiniteScrollPromptsProps) => {
  const { t } = useTranslation();

  const prompts: Prompt[] = [
    { icon: Calendar, textKey: "prompts.eventStart", category: "Schedule" },
    { icon: Calendar, textKey: "prompts.eventDuration", category: "Schedule" },
    { icon: MapPin, textKey: "prompts.eventLocation", category: "Location" },
    { icon: Presentation, textKey: "prompts.eventStages", category: "Venue" },
    { icon: Mic, textKey: "prompts.keynoteSpeakers", category: "Speakers" },
    { icon: Lightbulb, textKey: "prompts.mainThemes", category: "Themes" },
    { icon: Briefcase, textKey: "prompts.startupEvents", category: "Startups" },
    { icon: Users, textKey: "prompts.womenInTech", category: "Diversity" },
    { icon: Calendar, textKey: "prompts.june12Events", category: "Schedule" },
    { icon: Bot, textKey: "prompts.aiHealthcare", category: "AI" },
    { icon: Leaf, textKey: "prompts.sustainabilitySessions", category: "Sustainability" },
    { icon: Network, textKey: "prompts.investorNetworking", category: "Networking" },
    { icon: Cpu, textKey: "prompts.quantumComputing", category: "Quantum" },
    { icon: Music, textKey: "prompts.liveEntertainment", category: "Entertainment" },
    { icon: Award, textKey: "prompts.awards", category: "Awards" },
    { icon: Briefcase, textKey: "prompts.futureOfWork", category: "Future" },
    { icon: Bot, textKey: "prompts.aiIndustry", category: "AI" },
    { icon: Leaf, textKey: "prompts.climateGreenTech", category: "Climate" },
    { icon: Code, textKey: "prompts.robotics", category: "Robotics" },
    { icon: Users, textKey: "prompts.internationalSpeakers", category: "International" },
  ];

  const firstLine = prompts.slice(0, 7);
  const secondLine = prompts.slice(7, 14);
  const thirdLine = prompts.slice(14, 20);

  const PromptButton = ({ prompt, index }: { prompt: Prompt; index: number }) => {
    const Icon = prompt.icon;
    const translatedText = t(prompt.textKey);
    
    return (
      <button
        onClick={() => onPromptSelect(translatedText)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700 transition-colors whitespace-nowrap text-sm mr-3 last:mr-0"
      >
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-white">{translatedText}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* First line - moving left */}
      <div className="relative overflow-hidden">
        <div className="flex animate-[scroll-left_25s_linear_infinite] will-change-transform">
          {[...firstLine, ...firstLine, ...firstLine, ...firstLine].map((prompt, index) => (
            <PromptButton key={`line1-${index}`} prompt={prompt} index={index} />
          ))}
        </div>
      </div>

      {/* Second line - moving right */}
      <div className="relative overflow-hidden">
        <div className="flex animate-[scroll-right_30s_linear_infinite] will-change-transform">
          {[...secondLine, ...secondLine, ...secondLine, ...secondLine].map((prompt, index) => (
            <PromptButton key={`line2-${index}`} prompt={prompt} index={index} />
          ))}
        </div>
      </div>

      {/* Third line - moving left */}
      <div className="relative overflow-hidden">
        <div className="flex animate-[scroll-left_35s_linear_infinite] will-change-transform">
          {[...thirdLine, ...thirdLine, ...thirdLine, ...thirdLine].map((prompt, index) => (
            <PromptButton key={`line3-${index}`} prompt={prompt} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfiniteScrollPrompts;
