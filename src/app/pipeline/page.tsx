import PipelineBoard from "./pipeline-board";

export default function PipelinePage() {
  return (
    <main className="p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Pipeline</h1>

        <a
          href="/api/export/csv"
          className="border rounded px-3 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      <PipelineBoard />
    </main>
  );
}
