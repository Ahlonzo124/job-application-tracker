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

/* =========================
   Constants
   ========================= */

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
  return STAGES.map((s) => s.key).includes(id as ApplicationStage);
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

/* =========================
   Component
   ========================= */

export default function PipelineBoard() {
  const [columns, setColumns] = useState<ColumnsState>(emptyColumns());
  const columnsRef = useRef(columns);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔍 SEARCH
  const [query, setQuery] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
      await fetch("/api/board/reorder", {
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
    const from = findContainer(current, activeId);
    const to = findContainer(current, overId);

    if (!from || !to || from === to) return;

    setColumns((prev) => {
      const source = [...prev[from]];
      const dest = [...prev[to]];

      const idx = findIndexById(source, activeId);
      if (idx === -1) return prev;

      const [moving] = source.splice(idx, 1);
      dest.push({ ...moving, stage: to });

      return { ...prev, [from]: source, [to]: dest };
    });
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const id = String(active.id);
    const overId = String(over.id);

    const current = columnsRef.current;
    const stage = findContainer(current, id);
    const overStage = findContainer(current, overId);

    if (!stage || !overStage) return;

    if (stage === overStage) {
      const items = current[stage];
      const oldIndex = findIndexById(items, id);
      const newIndex = findIndexById(items, overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const moved = arrayMove(items, oldIndex, newIndex);
        const next = { ...current, [stage]: moved };
        setColumns(next);
        await persistColumns(next);
        return;
      }
    }

    await persistColumns(columnsRef.current);
  }

  // 🔍 FILTERED VIEW (does NOT mutate source columns)
  const filteredColumns = useMemo(() => {
    if (!query.trim()) return columns;

    const q = query.toLowerCase();

    const filter = (a: Application) =>
      a.company.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q);

    const out = emptyColumns();
    for (const s of Object.keys(columns) as ApplicationStage[]) {
      out[s] = columns[s].filter(filter);
    }
    return out;
  }, [columns, query]);

  if (loading) return <div>Loading…</div>;

  return (
    <>
      <ApplicationDrawer
        open={drawerOpen}
        applicationId={selectedId}
        onClose={() => setDrawerOpen(false)}
        onSaved={refresh}
      />

      {/* 🔍 SEARCH BAR */}
      <div
        className="win95-panel"
        style={{ padding: 8, marginBottom: 8, display: "flex", gap: 8 }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company or title..."
          className="win95-input"
          style={{ flex: 1 }}
        />
        {query && (
          <button className="win95-btn" onClick={() => setQuery("")}>
            Clear
          </button>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="pipeline-columns">
          {STAGES.map((s) => (
            <Column
              key={s.key}
              stage={s.key}
              label={s.label}
              items={filteredColumns[s.key]}
              onOpen={(id) => {
                setSelectedId(id);
                setDrawerOpen(true);
              }}
            />
          ))}
        </div>
      </DndContext>

      {saving && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          Saving…
        </div>
      )}
    </>
  );
}

/* =========================
   Column
   ========================= */

function Column({
  stage,
  label,
  items,
  onOpen,
}: {
  stage: ApplicationStage;
  label: string;
  items: Application[];
  onOpen: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const ids = items.map((a) => String(a.id));

  return (
    <section
      ref={setNodeRef}
      className="pipeline-col win95-panel"
      style={{ background: isOver ? "#dcdcdc" : undefined }}
    >
      <div
        style={{
          fontWeight: 900,
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.6 }}>{items.length}</span>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="pipeline-col-body">
          {items.map((a) => (
            <Card key={a.id} app={a} onOpen={onOpen} />
          ))}
        </div>
      </SortableContext>

      {items.length === 0 && (
        <div style={{ fontSize: 12, opacity: 0.6 }}>Drop here</div>
      )}
    </section>
  );
}

/* =========================
   Card
   ========================= */

function Card({ app, onOpen }: { app: Application; onOpen: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(app.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="win95-bevel"
      onClick={() => onOpen(app.id)}
    >
      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="win95-btn"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{ padding: "2px 6px" }}
          title="Drag"
        >
          ::
        </button>

        <div>
          <div style={{ fontWeight: 700 }}>{app.title}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{app.company}</div>
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 12, textDecoration: "underline" }}
            >
              Job link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
