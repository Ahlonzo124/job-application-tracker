"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Application, ApplicationStage } from "@prisma/client";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ApplicationDrawer from "@/components/ApplicationDrawer";

const STAGES: { key: ApplicationStage; label: string }[] = [
  { key: "APPLIED", label: "Applied" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "HIRED", label: "Hired" },
  { key: "REJECTED", label: "Rejected" },
];

type ColumnsState = Record<ApplicationStage, Application[]>;

function emptyColumns(): ColumnsState {
  return {
    APPLIED: [],
    INTERVIEW: [],
    OFFER: [],
    HIRED: [],
    REJECTED: [],
  };
}

function buildColumns(apps: Application[]): ColumnsState {
  const cols = emptyColumns();
  for (const a of apps) cols[a.stage].push(a);
  for (const s of Object.keys(cols) as ApplicationStage[]) {
    cols[s].sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0));
  }
  return cols;
}

function isStageId(id: string): id is ApplicationStage {
  return (STAGES.map((s) => s.key) as string[]).includes(id);
}

function findContainer(columns: ColumnsState, id: string): ApplicationStage | null {
  if (isStageId(id)) return id;
  const num = Number(id);
  if (Number.isNaN(num)) return null;

  for (const stage of Object.keys(columns) as ApplicationStage[]) {
    if (columns[stage].some((a) => a.id === num)) return stage;
  }
  return null;
}

function findIndexById(list: Application[], id: string) {
  const num = Number(id);
  if (Number.isNaN(num)) return -1;
  return list.findIndex((a) => a.id === num);
}

function matchesQuery(app: Application, q: string) {
  if (!q) return true;
  const hay = [
    app.company ?? "",
    app.title ?? "",
    app.location ?? "",
    app.jobType ?? "",
    app.workMode ?? "",
    app.seniority ?? "",
    app.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return hay.includes(q);
}

export default function PipelineBoard() {
  const [columns, setColumns] = useState<ColumnsState>(emptyColumns());
  const columnsRef = useRef(columns);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [hideRejected, setHideRejected] = useState(false);
  const [hideHired, setHideHired] = useState(false);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/board", { cache: "no-store" });
    const data = (await res.json()) as Application[];
    setColumns(buildColumns(data));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function persistColumns(next: ColumnsState) {
    setSaving(true);
    try {
      const r = await fetch("/api/board/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: {
            APPLIED: next.APPLIED.map((a) => a.id),
            INTERVIEW: next.INTERVIEW.map((a) => a.id),
            OFFER: next.OFFER.map((a) => a.id),
            HIRED: next.HIRED.map((a) => a.id),
            REJECTED: next.REJECTED.map((a) => a.id),
          },
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const current = columnsRef.current;
    const activeContainer = findContainer(current, activeId);
    const overContainer = findContainer(current, overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const source = [...prev[activeContainer]];
      const dest = [...prev[overContainer]];

      const sourceIndex = findIndexById(source, activeId);
      if (sourceIndex === -1) return prev;

      const [moving] = source.splice(sourceIndex, 1);

      const insertAt = isStageId(overId)
        ? dest.length
        : Math.max(findIndexById(dest, overId), 0);

      dest.splice(insertAt, 0, { ...moving, stage: overContainer });

      return {
        ...prev,
        [activeContainer]: source,
        [overContainer]: dest,
      };
    });
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const current = columnsRef.current;
    const activeContainer = findContainer(current, activeId);
    const overContainer = findContainer(current, overId);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const items = current[activeContainer];
      const oldIndex = findIndexById(items, activeId);
      const newIndex = isStageId(overId) ? items.length - 1 : findIndexById(items, overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const moved = arrayMove(items, oldIndex, newIndex);
        const next = { ...current, [activeContainer]: moved };
        setColumns(next);
        await persistColumns(next);
        return;
      }
    }

    await persistColumns(columnsRef.current);
  }

  const q = query.trim().toLowerCase();

  // IMPORTANT: We filter for rendering only; we do NOT mutate "columns" (DnD source of truth).
  const filteredColumns = useMemo<ColumnsState>(() => {
    const next = emptyColumns();

    for (const stage of Object.keys(columns) as ApplicationStage[]) {
      // Hide toggles
      if (hideRejected && stage === "REJECTED") continue;
      if (hideHired && stage === "HIRED") continue;

      next[stage] = columns[stage].filter((a) => matchesQuery(a, q));
    }

    return next;
  }, [columns, q, hideRejected, hideHired]);

  const filteredCounts = useMemo(() => {
    const c: Record<ApplicationStage, number> = {
      APPLIED: filteredColumns.APPLIED.length,
      INTERVIEW: filteredColumns.INTERVIEW.length,
      OFFER: filteredColumns.OFFER.length,
      HIRED: filteredColumns.HIRED.length,
      REJECTED: filteredColumns.REJECTED.length,
    };
    return c;
  }, [filteredColumns]);

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <ApplicationDrawer
        open={drawerOpen}
        applicationId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onSaved={refresh}
      />

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm opacity-80">
          <span>Drag to move/reorder. Click a card to edit.</span>
          {saving ? <span className="opacity-100">Saving…</span> : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            className="w-full sm:w-[380px] border rounded p-2"
            placeholder="Search company, title, location, notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideRejected}
              onChange={(e) => setHideRejected(e.target.checked)}
            />
            Hide Rejected
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideHired}
              onChange={(e) => setHideHired(e.target.checked)}
            />
            Hide Hired
          </label>

          <button
            className="sm:ml-auto border rounded px-3 py-2 text-sm"
            onClick={() => {
              setQuery("");
              setHideRejected(true);
              setHideHired(false);
            }}
          >
            Reset
          </button>
        </div>

        {(query.trim() || hideRejected || hideHired) && (
          <div className="text-xs opacity-70">
            Tip: Drag/drop still saves. If you want to reorder precisely, clear search first.
          </div>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map((s) => {
            // Skip hidden stages
            if (hideRejected && s.key === "REJECTED") return null;
            if (hideHired && s.key === "HIRED") return null;

            return (
              <Column
                key={s.key}
                stage={s.key}
                label={s.label}
                count={filteredCounts[s.key]}
                items={filteredColumns[s.key]}
                onOpen={(id) => {
                  setSelectedId(id);
                  setDrawerOpen(true);
                }}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

function Column(props: {
  stage: ApplicationStage;
  label: string;
  count: number;
  items: Application[];
  onOpen: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: props.stage });
  const ids = props.items.map((a) => String(a.id));

  return (
    <section
      ref={setNodeRef}
      className={`rounded-lg border p-3 min-h-[120px] ${isOver ? "bg-black/5" : ""}`}
    >
      <h2 className="font-medium mb-3 flex justify-between">
        <span>{props.label}</span>
        <span className="text-sm opacity-60">{props.count}</span>
      </h2>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {props.items.map((a) => (
            <Card key={a.id} app={a} onOpen={props.onOpen} />
          ))}
        </div>
      </SortableContext>

      {props.items.length === 0 && (
        <div className="mt-3 text-sm opacity-60">Drop here</div>
      )}
    </section>
  );
}

function Card({ app, onOpen }: { app: Application; onOpen: (id: number) => void }) {
  // drag handle only (so clicking opens editor reliably)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(app.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border p-3 bg-white">
      <div className="flex items-start gap-2">
        <button
          className="border rounded px-2 py-1 text-xs opacity-80"
          title="Drag"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          ::
        </button>

        <div className="flex-1 cursor-pointer" onClick={() => onOpen(app.id)}>
          <div className="font-semibold">{app.title}</div>
          <div className="text-sm opacity-80">{app.company}</div>

          {app.url ? (
            <a
              className="text-sm underline mt-1 block"
              href={app.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Job link
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
