"use client";

import * as React from "react";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { ArrowUpDown, Kanban as KanbanIcon, List, Search, SlidersHorizontal, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { updateOrderKanbanStatus } from "./actions";
import { columnIds, columns } from "./columns";
import { KanbanColumn } from "./kanban-column";
import { KanbanMonthFilter } from "./month-filter";
import { TaskCard } from "./task-card";
import type { BoardState, ColumnId, Task } from "./types";
import { findColumnId, findTask } from "./utils";

interface KanbanProps {
  initialBoard: BoardState;
  currentMonth: string;
  selectedMonth: string;
}

function moveTaskToColumn(board: BoardState, taskId: string, targetColumnId: ColumnId, targetIndex?: number) {
  const sourceColumnId = findColumnId(board, taskId);
  if (!sourceColumnId) return board;

  const sourceItems = board[sourceColumnId];
  const sourceIndex = sourceItems.findIndex((task) => task.id === taskId);
  if (sourceIndex === -1) return board;

  const task = { ...sourceItems[sourceIndex], operationStatus: targetColumnId };

  if (sourceColumnId === targetColumnId) {
    if (targetIndex === undefined || sourceIndex === targetIndex) return board;
    return {
      ...board,
      [sourceColumnId]: arrayMove(sourceItems, sourceIndex, targetIndex),
    };
  }

  const targetItems = board[targetColumnId];
  const insertIndex = targetIndex ?? targetItems.length;

  return {
    ...board,
    [sourceColumnId]: sourceItems.filter((item) => item.id !== taskId),
    [targetColumnId]: [...targetItems.slice(0, insertIndex), task, ...targetItems.slice(insertIndex)],
  };
}

export function Kanban({ initialBoard, currentMonth, selectedMonth }: KanbanProps) {
  const [board, setBoard] = React.useState<BoardState>(initialBoard);
  const [columnOrder, setColumnOrder] = React.useState<ColumnId[]>(columnIds);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [activeColumnId, setActiveColumnId] = React.useState<ColumnId | null>(null);
  const boardBeforeDrag = React.useRef<BoardState | null>(null);
  const overColumnDuringDrag = React.useRef<ColumnId | null>(null);
  const orderedColumns = columnOrder.flatMap((columnId) => columns.find((column) => column.id === columnId) ?? []);

  React.useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "column") return;

    boardBeforeDrag.current = board;
    overColumnDuringDrag.current = findColumnId(board, String(event.active.id)) ?? null;
    const task = findTask(board, String(event.active.id));
    setActiveTask(task ?? null);
    setActiveColumnId(findColumnId(board, String(event.active.id)) ?? null);
  }

  function handleDragCancel() {
    if (boardBeforeDrag.current) {
      setBoard(boardBeforeDrag.current);
    }
    boardBeforeDrag.current = null;
    overColumnDuringDrag.current = null;
    setActiveTask(null);
    setActiveColumnId(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.data.current?.type === "column") return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setBoard((currentBoard) => {
      const activeColId = findColumnId(currentBoard, activeId);
      const overColId = findColumnId(currentBoard, overId);

      if (overColId) {
        overColumnDuringDrag.current = overColId;
        setActiveColumnId(overColId);
      }

      if (!activeColId || !overColId || activeColId === overColId) return currentBoard;

      const overItems = currentBoard[overColId];
      const overIndex = overItems.findIndex((task) => task.id === overId);
      const nextIndex = overIndex >= 0 ? overIndex : overItems.length;

      return moveTaskToColumn(currentBoard, activeId, overColId, nextIndex);
    });
  }

  function persistStatus(taskId: string, nextColumnId: ColumnId, snapshot: BoardState) {
    updateOrderKanbanStatus(taskId, nextColumnId).catch((error) => {
      console.error("Failed to update kanban order status", error);
      setBoard(snapshot);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeType = active.data.current?.type;
    const snapshot = boardBeforeDrag.current;
    const droppedColumnId = overColumnDuringDrag.current;
    boardBeforeDrag.current = null;
    overColumnDuringDrag.current = null;
    setActiveTask(null);
    setActiveColumnId(null);

    if (activeType === "column") {
      if (!over) return;

      const activeColumnId = String(active.id) as ColumnId;
      const overColumnId = findColumnId(board, String(over.id));
      if (!overColumnId || activeColumnId === overColumnId) return;

      setColumnOrder((currentOrder) => {
        const activeIndex = currentOrder.indexOf(activeColumnId);
        const overIndex = currentOrder.indexOf(overColumnId);
        if (activeIndex === -1 || overIndex === -1) return currentOrder;
        return arrayMove(currentOrder, activeIndex, overIndex);
      });
      return;
    }

    if (!snapshot) return;

    if (!over) {
      setBoard(snapshot);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const previousColumnId = findColumnId(snapshot, activeId);
    const nextColumnId = droppedColumnId ?? findColumnId(board, activeId) ?? findColumnId(board, overId);

    if (!previousColumnId || !nextColumnId) {
      setBoard(snapshot);
      return;
    }

    setBoard((currentBoard) => {
      const currentColumnId = findColumnId(currentBoard, activeId);
      const overColumnId = findColumnId(currentBoard, overId);
      if (!currentColumnId || !overColumnId) return currentBoard;

      const overItems = currentBoard[overColumnId];
      const overIndex = overItems.findIndex((task) => task.id === overId);
      return moveTaskToColumn(currentBoard, activeId, overColumnId, overIndex >= 0 ? overIndex : undefined);
    });

    if (previousColumnId !== nextColumnId) {
      persistStatus(activeId, nextColumnId, snapshot);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <KanbanMonthFilter currentMonth={currentMonth} selectedMonth={selectedMonth} />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:justify-end">
          <InputGroup className="min-w-0 sm:w-64 2xl:w-48">
            <InputGroupInput type="search" placeholder="Tìm đơn hàng" />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/25 px-4 pt-4 pb-0 [scrollbar-color:var(--border)_transparent] lg:px-5 lg:pt-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
          <div className="inline-grid h-full min-w-full grid-cols-[repeat(9,minmax(18rem,1fr))] gap-4">
            <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
              {orderedColumns.map((column) => (
                <KanbanColumn key={column.id} column={column} tasks={board[column.id]} />
              ))}
            </SortableContext>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} columnId={activeColumnId ?? undefined} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
