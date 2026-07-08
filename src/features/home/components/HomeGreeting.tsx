import { Sunrise, Sun, Moon, Calendar } from 'lucide-react';

interface HomeGreetingProps {
  userName?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia'};
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde'};
  return { text: 'Boa noite'};
}

function getFirstName(fullName: string | undefined) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

export default function HomeGreeting({ userName }: HomeGreetingProps) {
  const greeting = getGreeting();
  const GreetingIcon = greeting.Icon;

  // Format current date in Portuguese
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          {greeting.text}, <span className="text-primary">{getFirstName(userName)}</span>
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-1">
          Confira o resumo das pautas fiscais.
        </p>
      </div>
    </section>
  );
}
