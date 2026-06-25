import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string // YYYY-MM-DD
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const parsedDate = value ? parseISO(value) : null
  const isDateValid = parsedDate && isValid(parsedDate)

  // O mês/ano visualizado no calendário
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    return isDateValid ? parsedDate : new Date()
  })

  React.useEffect(() => {
    if (isDateValid) {
      setViewDate(parsedDate)
    }
  }, [value])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // Nomes dos meses em português
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  // Dias da semana
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"]

  // Quantidade de dias no mês
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // Dia da semana do primeiro dia do mês (0 = Domingo)
  const firstDayIndex = new Date(year, month, 1).getDay()

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    // Formata o dia, mês e ano no padrão YYYY-MM-DD local
    const selectedDate = new Date(year, month, day)
    const yyyy = selectedDate.getFullYear()
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const dd = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    
    onChange?.(dateStr)
    setOpen(false)
  }

  // Gera a lista de dias (offset + dias do mês)
  const daysArray = []
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i)
  }

  const formattedLabel = isDateValid 
    ? format(parsedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal text-xs h-10 px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{formattedLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-popover border rounded-lg shadow-md" align="start">
        {/* Header do calendário */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold text-foreground">
            {monthNames[month]} de {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid de dias da semana */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mb-1">
          {weekDays.map((day, idx) => (
            <div key={idx} className="h-6 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de dias do mês */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-7" />
            }

            const isSelected = isDateValid && 
              parsedDate.getFullYear() === year &&
              parsedDate.getMonth() === month &&
              parsedDate.getDate() === day

            const isToday = new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === day

            return (
              <button
                key={`day-${day}`}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "h-7 w-7 rounded-md text-xs font-normal transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-center",
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-semibold",
                  isToday && !isSelected && "border border-primary/45 text-primary font-medium"
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
