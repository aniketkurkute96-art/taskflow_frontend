import Timeline from './Timeline';

interface TimelinePanelProps {
  items: Array<any>;
}

export default function TimelinePanel({ items }: TimelinePanelProps) {
  return (
    <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700 shadow-lg dark:shadow-cyan-900/20 transition-all duration-200">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Activity</h3>
      </header>
      <div className="mt-4 max-h-[56vh] overflow-auto pr-1">
        <Timeline items={items} />
      </div>
    </section>
  );
}


