const ClickupHome = () => {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        ClickUp-style workspace
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        The enhanced projects sidebar and task list experience will appear here
        when the feature flag is enabled.
      </p>
      <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
        PR1 — Shell setup complete
      </p>
    </div>
  );
};

export default ClickupHome;


