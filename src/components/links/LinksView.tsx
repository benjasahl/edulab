"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { QuickLink } from "@/types";

function ensureHttp(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function isValidUrl(url: string): boolean {
  return /^https?:\/\/.+/i.test(url.trim());
}

export default function LinksView() {
  const links = useAppStore((s) => s.data.links);
  const addLink = useAppStore((s) => s.addLink);
  const updateLink = useAppStore((s) => s.updateLink);
  const deleteLink = useAppStore((s) => s.deleteLink);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addError, setAddError] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editError, setEditError] = useState("");

  // Delete confirm
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const sortedLinks = [...links].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );

  function handleAdd() {
    const name = addName.trim();
    const url = ensureHttp(addUrl);
    if (!name) {
      setAddError("Ange ett namn för länken.");
      return;
    }
    if (!isValidUrl(url)) {
      setAddError("URL:en måste börja med http:// eller https://");
      return;
    }
    addLink({ name, url });
    setAddName("");
    setAddUrl("");
    setAddError("");
    setShowAddForm(false);
  }

  function handleStartEdit(link: QuickLink) {
    setEditId(link.id);
    setEditName(link.name);
    setEditUrl(link.url);
    setEditError("");
    setDeletePendingId(null);
  }

  function handleSaveEdit(id: string) {
    const name = editName.trim();
    const url = ensureHttp(editUrl);
    if (!name) {
      setEditError("Ange ett namn.");
      return;
    }
    if (!isValidUrl(url)) {
      setEditError("URL:en måste börja med http:// eller https://");
      return;
    }
    updateLink(id, { name, url });
    setEditId(null);
    setEditError("");
  }

  function handleCancelEdit() {
    setEditId(null);
    setEditError("");
  }

  function handleDelete(id: string) {
    if (deletePendingId === id) {
      deleteLink(id);
      setDeletePendingId(null);
    } else {
      setDeletePendingId(id);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Snabblänkar</h2>
        {!showAddForm && (
          <button
            className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
            onClick={() => {
              setShowAddForm(true);
              setAddName("");
              setAddUrl("");
              setAddError("");
            }}
          >
            + Lägg till länk
          </button>
        )}
      </div>

      {/* Add link form */}
      {showAddForm && (
        <div className="border border-slate-200 rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3 max-w-md">
          <p className="text-sm font-semibold text-slate-700">Ny länk</p>
          <div className="flex flex-col gap-2">
            <input
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Namn (t.ex. Skolverket)"
              value={addName}
              onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setShowAddForm(false);
              }}
            />
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="URL (t.ex. https://skolverket.se)"
              value={addUrl}
              onChange={(e) => { setAddUrl(e.target.value); setAddError(""); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setShowAddForm(false);
              }}
            />
            {addError && (
              <p className="text-xs text-red-500">{addError}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
              onClick={handleAdd}
            >
              Spara
            </button>
            <button
              className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
              onClick={() => {
                setShowAddForm(false);
                setAddError("");
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sortedLinks.length === 0 && !showAddForm && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          Inga snabblänkar ännu. Lägg till din första länk.
        </div>
      )}

      {/* Links grid */}
      {sortedLinks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedLinks.map((link) => {
            const isEditing = editId === link.id;
            const isPendingDelete = deletePendingId === link.id;

            if (isEditing) {
              return (
                <div
                  key={link.id}
                  className="border border-orange-300 ring-1 ring-orange-200 rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Redigera länk
                  </p>
                  <div className="flex flex-col gap-2">
                    <input
                      autoFocus
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Namn"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(link.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <input
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="URL"
                      value={editUrl}
                      onChange={(e) => { setEditUrl(e.target.value); setEditError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(link.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    {editError && (
                      <p className="text-xs text-red-500">{editError}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
                      onClick={() => handleSaveEdit(link.id)}
                    >
                      Spara
                    </button>
                    <button
                      className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                      onClick={handleCancelEdit}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={link.id}
                className="border border-slate-200 rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3"
              >
                {/* Card header */}
                <div>
                  <p className="text-sm font-bold text-slate-800 truncate">{link.name}</p>
                  <p
                    className="text-xs text-slate-400 truncate mt-0.5"
                    title={link.url}
                  >
                    {link.url}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors text-sm"
                  >
                    Öppna
                  </a>
                  <button
                    className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
                    onClick={() => handleStartEdit(link)}
                  >
                    Redigera
                  </button>
                  <button
                    className={`font-semibold px-3.5 py-2 rounded-xl transition-colors text-sm ${
                      isPendingDelete
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => handleDelete(link.id)}
                    title={isPendingDelete ? "Klicka igen för att bekräfta" : "Ta bort"}
                  >
                    {isPendingDelete ? "Bekräfta" : "Ta bort"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
