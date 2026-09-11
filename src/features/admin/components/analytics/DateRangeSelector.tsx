import { Tabs } from '@heroui/react'
import type { DateRangeDays } from '../../hooks/useAnalytics'

interface DateRangeSelectorProps {
  days: DateRangeDays
  onChange: (days: DateRangeDays) => void
}

const DateRangeSelector = ({ days, onChange }: DateRangeSelectorProps) => {
  return (
    <Tabs
      selectedKey={String(days)}
      onSelectionChange={(key) => onChange(Number(key) as DateRangeDays)}
      aria-label="Select date range"
    >
      <Tabs.List className="bg-[#1c1c24] border border-zinc-800 rounded-xl p-1 gap-1 flex items-center shadow-inner">
        <Tabs.Tab
          id="1"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-all cursor-pointer"
        >
          1 Day
        </Tabs.Tab>
        <Tabs.Tab
          id="7"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-all cursor-pointer"
        >
          7 Days
        </Tabs.Tab>
        <Tabs.Tab
          id="30"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-all cursor-pointer"
        >
          30 Days
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  )
}

export default DateRangeSelector
