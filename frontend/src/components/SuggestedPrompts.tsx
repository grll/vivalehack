
import { Coffee, UtensilsCrossed, ShoppingCart, Fuel, Hospital, GraduationCap } from 'lucide-react';

interface SuggestedPromptsProps {
  onPromptSelect: (prompt: string) => void;
}

const SuggestedPrompts = ({ onPromptSelect }: SuggestedPromptsProps) => {
  const prompts = [
    {
      icon: Coffee,
      text: "Is there any vegan coffee around me?",
      category: "Food & Drink"
    },
    {
      icon: UtensilsCrossed,
      text: "What is the best burger shop here?",
      category: "Restaurants"
    },
    {
      icon: ShoppingCart,
      text: "List best supermarkets in 5km",
      category: "Shopping"
    },
    {
      icon: Fuel,
      text: "Find nearest gas stations",
      category: "Services"
    },
    {
      icon: Hospital,
      text: "Where are the closest hospitals?",
      category: "Healthcare"
    },
    {
      icon: GraduationCap,
      text: "Show me nearby gyms and fitness centers",
      category: "Fitness"
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-gray-900 dark:text-white font-semibold text-sm">Popular searches near you</h3>
      <div className="grid grid-cols-1 gap-2">
        {prompts.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
            <button
              key={index}
              onClick={() => onPromptSelect(prompt.text)}
              className="flex items-center gap-3 p-3 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 text-left group backdrop-blur-sm"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white text-sm font-medium">{prompt.text}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{prompt.category}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
