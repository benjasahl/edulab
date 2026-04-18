"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { uid } from "@/lib/utils";

export default function ClassesView() {
  const classes = useAppStore((s) => s.data.classes);
  const activeClassId = useAppStore((s) => s.data.ui.activeClassId);
  const addClassDialogOpen = useAppStore((s) => s.dialogs.addClassDialogOpen);
  const classDeletePendingId = useAppStore((s) => s.dialogs.classDeletePendingId);
  const classEditPendingId = useAppStore((s) => s.dialogs.classEditPendingId);
  const classStudentDeletePendingIndex = useAppStore((s) => s.dialogs.classStudentDeletePendingIndex);

  const setActiveClassId = useAppStore((s) => s.setActiveClassId);
  const setAddClassDialogOpen = useAppStore((s) => s.setAddClassDialogOpen);
  const setClassDeletePending = useAppStore((s) => s.setClassDeletePending);
  const setClassEditPending = useAppStore((s) => s.setClassEditPending);
  const setClassStudentDeletePending = useAppStore((s) => s.setClassStudentDeletePending);
  const addClass = useAppStore((s) => s.addClass);
  const updateClass = useAppStore((s) => s.updateClass);
  const deleteClass = useAppStore((s) => s.deleteClass);
  const addStudent = useAppStore((s) => s.addStudent);
  const updateStudent = useAppStore((s) => s.updateStudent);
  const deleteStudent = useAppStore((s) => s.deleteStudent);
  const lockClass = useAppStore((s) => s.lockClass);

  // Add class form
  const [newClassName, setNewClassName] = useState("");

  // Edit class name
  const [editClassName, setEditClassName] = useState("");

  // Add student form
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");

  // Inline student edit
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [editStudentFirst, setEditStudentFirst] = useState("");
  const [editStudentLast, setEditStudentLast] = useState("");

  const activeClass = classes.find((c) => c.id === activeClassId) ?? null;

  function handleAddClass() {
    const name = newClassName.trim();
    if (!name) return;
    const cls = addClass({ name, locked: false, students: [] });
    setNewClassName("");
    setAddClassDialogOpen(false);
    setActiveClassId(cls.id);
  }

  function handleDeleteClass(id: string) {
    if (classDeletePendingId === id) {
      deleteClass(id);
      setClassDeletePending("");
      if (activeClassId === id) setActiveClassId("");
    } else {
      setClassDeletePending(id);
    }
  }

  function handleStartEditClass(id: string, currentName: string) {
    setClassEditPending(id);
    setEditClassName(currentName);
  }

  function handleSaveEditClass(id: string) {
    const name = editClassName.trim();
    if (name) updateClass(id, { name });
    setClassEditPending("");
    setEditClassName("");
  }

  function handleAddStudent() {
    if (!activeClassId) return;
    const first = newFirstName.trim();
    const last = newLastName.trim();
    if (!first && !last) return;
    addStudent(activeClassId, first, last);
    setNewFirstName("");
    setNewLastName("");
    setShowAddStudent(false);
  }

  function handleDeleteStudent(index: number) {
    if (!activeClassId) return;
    if (classStudentDeletePendingIndex === index) {
      deleteStudent(activeClassId, index);
      setClassStudentDeletePending(-1);
    } else {
      setClassStudentDeletePending(index);
    }
  }

  function handleStartEditStudent(id: string, first: string, last: string) {
    setEditStudentId(id);
    setEditStudentFirst(first);
    setEditStudentLast(last);
  }

  function handleSaveEditStudent(classId: string, studentId: string) {
    updateStudent(classId, studentId, {
      firstName: editStudentFirst.trim(),
      lastName: editStudentLast.trim(),
    });
    setEditStudentId(null);
  }

  return (
    <div className="view-scroll-inner flex gap-6 min-h-0">
      {/* ── Left panel: class list ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Klasser</h2>
          <button
            className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
            onClick={() => {
              setNewClassName("");
              setAddClassDialogOpen(true);
            }}
          >
            + Lägg till klass
          </button>
        </div>

        {/* Add class modal */}
        {addClassDialogOpen && (
          <div className="border border-slate-200 rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-2">
            <p className="text-sm font-semibold text-slate-700">Ny klass</p>
            <input
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Klassnamn…"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddClass();
                if (e.key === "Escape") setAddClassDialogOpen(false);
              }}
            />
            <div className="flex gap-2">
              <button
                className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
                onClick={handleAddClass}
              >
                Spara
              </button>
              <button
                className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                onClick={() => setAddClassDialogOpen(false)}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Class list */}
        <ul className="flex flex-col gap-1.5">
          {classes.map((cls) => {
            const isActive = cls.id === activeClassId;
            const isPendingDelete = classDeletePendingId === cls.id;
            const isPendingEdit = classEditPendingId === cls.id;

            return (
              <li
                key={cls.id}
                className={`border rounded-2xl bg-white shadow-sm px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
                  isActive
                    ? "border-orange-400 ring-1 ring-orange-300"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => {
                  if (!isPendingEdit) {
                    setActiveClassId(cls.id);
                    setClassDeletePending("");
                    setClassStudentDeletePending(-1);
                    setShowAddStudent(false);
                    setEditStudentId(null);
                  }
                }}
              >
                {isPendingEdit ? (
                  <input
                    autoFocus
                    className="w-full border border-slate-200 rounded-xl px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEditClass(cls.id);
                      if (e.key === "Escape") setClassEditPending("");
                    }}
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                    {cls.name}
                  </span>
                )}

                {cls.locked && !isPendingEdit && (
                  <span title="Låst" className="text-slate-400 text-xs">🔒</span>
                )}

                {isPendingEdit ? (
                  <button
                    className="text-xs text-orange-600 font-semibold hover:underline ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEditClass(cls.id);
                    }}
                  >
                    Spara
                  </button>
                ) : (
                  <button
                    className="text-xs text-slate-400 hover:text-orange-600 transition-colors"
                    title="Redigera namn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditClass(cls.id, cls.name);
                    }}
                  >
                    ✏️
                  </button>
                )}

                <button
                  className={`text-xs font-semibold transition-colors ${
                    isPendingDelete
                      ? "text-red-600"
                      : "text-slate-400 hover:text-red-500"
                  }`}
                  title={isPendingDelete ? "Klicka igen för att bekräfta" : "Ta bort klass"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClass(cls.id);
                  }}
                >
                  {isPendingDelete ? "Bekräfta" : "🗑"}
                </button>
              </li>
            );
          })}
          {classes.length === 0 && (
            <li className="text-sm text-slate-400 text-center py-6">
              Inga klasser ännu.
            </li>
          )}
        </ul>
      </div>

      {/* ── Right panel: students ── */}
      {activeClass ? (
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-slate-800">
              {activeClass.name}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {activeClass.students.length} elev{activeClass.students.length !== 1 ? "er" : ""}
              </span>
            </h2>
            {!activeClass.locked && (
              <button
                className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                onClick={() => lockClass(activeClass.id)}
              >
                🔒 Lås klass
              </button>
            )}
            {activeClass.locked && (
              <span className="text-sm text-slate-400 flex items-center gap-1">
                🔒 <span>Klassen är låst</span>
              </span>
            )}
          </div>

          {/* Student table */}
          <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Förnamn</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Efternamn</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {activeClass.students.map((student, idx) => {
                  const isPendingDel = classStudentDeletePendingIndex === idx;
                  const isEditingStudent = editStudentId === student.id;

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-2" onClick={() => !isEditingStudent && handleStartEditStudent(student.id, student.firstName, student.lastName)}>
                        {isEditingStudent ? (
                          <input
                            autoFocus
                            className="w-full border border-slate-200 rounded-xl px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={editStudentFirst}
                            onChange={(e) => setEditStudentFirst(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEditStudent(activeClass.id, student.id);
                              if (e.key === "Escape") setEditStudentId(null);
                            }}
                          />
                        ) : (
                          <span className="cursor-pointer hover:text-orange-600 transition-colors">
                            {student.firstName || <span className="text-slate-300 italic">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2" onClick={() => !isEditingStudent && handleStartEditStudent(student.id, student.firstName, student.lastName)}>
                        {isEditingStudent ? (
                          <div className="flex gap-2 items-center">
                            <input
                              className="w-full border border-slate-200 rounded-xl px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                              value={editStudentLast}
                              onChange={(e) => setEditStudentLast(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEditStudent(activeClass.id, student.id);
                                if (e.key === "Escape") setEditStudentId(null);
                              }}
                            />
                            <button
                              className="bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-xl hover:bg-orange-700 transition-colors text-xs whitespace-nowrap"
                              onClick={() => handleSaveEditStudent(activeClass.id, student.id)}
                            >
                              Spara
                            </button>
                            <button
                              className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-xs"
                              onClick={() => setEditStudentId(null)}
                            >
                              Avbryt
                            </button>
                          </div>
                        ) : (
                          <span className="cursor-pointer hover:text-orange-600 transition-colors">
                            {student.lastName || <span className="text-slate-300 italic">—</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {!isEditingStudent && (
                          <button
                            className={`text-xs font-semibold transition-colors ${
                              isPendingDel
                                ? "text-red-600"
                                : "text-slate-400 hover:text-red-500"
                            }`}
                            title={isPendingDel ? "Klicka igen för att bekräfta" : "Ta bort elev"}
                            onClick={() => handleDeleteStudent(idx)}
                          >
                            {isPendingDel ? "Bekräfta" : "🗑"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {activeClass.students.length === 0 && !showAddStudent && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-sm">
                      Inga elever ännu.
                    </td>
                  </tr>
                )}

                {/* Add student inline row */}
                {showAddStudent && (
                  <tr className="border-t border-slate-100 bg-orange-50/40">
                    <td className="px-4 py-2">
                      <input
                        autoFocus
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Förnamn"
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddStudent();
                          if (e.key === "Escape") {
                            setShowAddStudent(false);
                            setNewFirstName("");
                            setNewLastName("");
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Efternamn"
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddStudent();
                          if (e.key === "Escape") {
                            setShowAddStudent(false);
                            setNewFirstName("");
                            setNewLastName("");
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
                          onClick={handleAddStudent}
                        >
                          Spara
                        </button>
                        <button
                          className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                          onClick={() => {
                            setShowAddStudent(false);
                            setNewFirstName("");
                            setNewLastName("");
                          }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!showAddStudent && !activeClass.locked && (
            <button
              className="self-start bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
              onClick={() => {
                setShowAddStudent(true);
                setEditStudentId(null);
              }}
            >
              + Lägg till elev
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Välj en klass till vänster för att se elever.
        </div>
      )}
    </div>
  );
}
