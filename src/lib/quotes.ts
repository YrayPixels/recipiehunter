// Motivational quotes library for notifications

export interface Quote {
  text: string;
  author?: string;
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  { text: "Every day is a fresh start. You've got this! 💪", author: "Break Free" },
  { text: "Progress, not perfection. Every step forward counts. 🌟", author: "Break Free" },
  { text: "You are stronger than your urges. Keep going! 💚", author: "Break Free" },
  { text: "One day at a time. You're building a better future. ✨", author: "Break Free" },
  { text: "Your past doesn't define you. Your actions today do. 🎯", author: "Break Free" },
  { text: "Every moment you choose recovery is a victory. 🏆", author: "Break Free" },
  { text: "You're not alone in this journey. Keep pushing forward. 🤝", author: "Break Free" },
  { text: "Small steps lead to big changes. You're doing great! 🌱", author: "Break Free" },
  { text: "Your commitment to change is powerful. Stay strong! 💫", author: "Break Free" },
  { text: "Every day clean is a day closer to freedom. Keep it up! 🎉", author: "Break Free" },
  { text: "You have the power to break free. Believe in yourself! 🔥", author: "Break Free" },
  { text: "Recovery is a journey, not a destination. You're on the right path. 🛤️", author: "Break Free" },
  { text: "Your future self will thank you for today's choices. 🙏", author: "Break Free" },
  { text: "Strength comes from overcoming challenges. You're doing it! 💪", author: "Break Free" },
  { text: "Every urge resisted is a victory. You're winning! 🎊", author: "Break Free" },
  { text: "You're building new habits, one day at a time. Keep going! 🌈", author: "Break Free" },
  { text: "Your willpower is stronger than you think. Trust yourself! ⚡", author: "Break Free" },
  { text: "Recovery takes courage. You have that courage. 🦁", author: "Break Free" },
  { text: "Every moment of resistance makes you stronger. 💎", author: "Break Free" },
  { text: "You're creating the life you deserve. Keep moving forward! 🚀", author: "Break Free" },
  { text: "The best time to start was yesterday. The second best time is now. ⏰", author: "Break Free" },
  { text: "You're not defined by your struggles, but by your strength to overcome them. 💪", author: "Break Free" },
  { text: "Every day you choose recovery, you choose yourself. ❤️", author: "Break Free" },
  { text: "Your journey is unique and valuable. Keep going! 🌟", author: "Break Free" },
  { text: "You have the power to rewrite your story. Start today. 📖", author: "Break Free" },
  { text: "Recovery is possible. You're proof of that. 🌺", author: "Break Free" },
  { text: "Every small victory counts. Celebrate your progress! 🎈", author: "Break Free" },
  { text: "You're stronger than your addiction. Show it! 💚", author: "Break Free" },
  { text: "The path to freedom starts with a single step. You've taken many. 🚶", author: "Break Free" },
  { text: "Your commitment inspires others. Keep inspiring yourself! ✨", author: "Break Free" },
];

// Get a random quote
export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex];
};

// Get a quote by index (for consistent scheduling)
export const getQuoteByIndex = (index: number): Quote => {
  const safeIndex = index % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[safeIndex];
};

