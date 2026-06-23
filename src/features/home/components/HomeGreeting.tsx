import { Sunrise, Sun, Moon } from 'lucide-react';

interface HomeGreetingProps {
  userName?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia', Icon: Sunrise, color: 'text-amber-500 dark:text-amber-400' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', Icon: Sun, color: 'text-orange-500 dark:text-orange-400' };
  return { text: 'Boa noite', Icon: Moon, color: 'text-indigo-400 dark:text-indigo-300' };
}

function getFirstName(fullName: string | undefined) {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

export default function HomeGreeting({ userName }: HomeGreetingProps) {
  const greeting = getGreeting();

  return (
    <section className="animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {greeting.text}, <span className="text-primary">{getFirstName(userName)}</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Confira o resumo do seu sistema de gestão de pautas fiscais.
          </p>
        </div>
      </div>
    </section>
  );
}
