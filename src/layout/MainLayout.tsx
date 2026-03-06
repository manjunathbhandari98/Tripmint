import { useEffect, useRef, useState } from "react";

import { Toaster } from "react-hot-toast";
import BookingForm, { type DraftType } from "../components/BookingForm";
import MessagePreview from "../components/MessagePreview";
import { generateMessage, type MessageType } from "../messageTemplate";
import Footer from "./Footer";
import Header from "./Header";

const DRAFT_KEY = "tripmint_drafts";

// Helper: get a readable label for a draft regardless of booking mode
const getDraftLabel = (draft: DraftType): string => {
  if (draft.bookingMode === "single") {
    return draft.passengerName || "Unnamed Ride";
  }
  // Multi-passenger: use names from bulk if saved, otherwise from passengers array
  if (draft.bulk?.names) {
    const names = draft.bulk.names
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  if (draft.passengers?.length) {
    const names = draft.passengers.map((p) => p.name).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }
  return "Unnamed Ride";
};

const MainLayout = () => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const [drafts, setDrafts] = useState<DraftType[]>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return [];

    const parsed: DraftType[] = JSON.parse(saved);
    const now = new Date().getTime();
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    const filtered = parsed.filter(
      (d) => now - new Date(d.savedAt).getTime() <= twoDays,
    );
    localStorage.setItem(DRAFT_KEY, JSON.stringify(filtered));
    return filtered;
  });

  const [loadedDraft, setLoadedDraft] = useState<DraftType | null>(null);

  const handleGenerate = (data: MessageType) => {
    setMessage(generateMessage(data));
    setTimeout(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleSaveDraft = (draft: DraftType) => {
    const updated = drafts.some((d) => d.id === draft.id)
      ? drafts.map((d) => (d.id === draft.id ? draft : d))
      : [...drafts, draft];
    setDrafts(updated);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  };

  const deleteDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  };

  // Search across all name fields
  const filteredDrafts = drafts.filter((draft) => {
    const label = getDraftLabel(draft).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form");
        form?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const saveBtn = document.querySelector(
          'button[type="button"][data-save="draft"]',
        ) as HTMLButtonElement | null;
        saveBtn?.click();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const todayBtn = document.querySelector(
          '[data-action="today"]',
        ) as HTMLButtonElement | null;
        todayBtn?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <Toaster position="bottom-right" />

      <div className="max-w-6xl mx-auto w-full px-4 py-8 grid lg:grid-cols-2 gap-8">
        {/* LEFT FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <BookingForm
            key={loadedDraft ? loadedDraft.id + loadedDraft.savedAt : "new"}
            onGenerate={handleGenerate}
            onSaveDraft={handleSaveDraft}
            initialDraft={loadedDraft}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          <div ref={previewRef} className="bg-white p-6 rounded-xl shadow-sm">
            <MessagePreview
              message={message}
              driverPhone=""
              passengerPhone=""
              onMessageUpdate={setMessage}
            />
          </div>

          {/* Drafts */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-[#075E54] mb-5">Saved Drafts</h3>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search passenger..."
              className="w-full px-4 py-2 mb-6 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            />

            {filteredDrafts.length === 0 && (
              <p className="text-sm text-gray-400">No drafts found.</p>
            )}

            <div className="space-y-4">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex justify-between items-center group transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-[#075E54] transition truncate max-w-[200px]">
                      {getDraftLabel(draft)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {draft.bookingMode !== "single" && (
                        <span className="mr-1 capitalize text-[#075E54]">
                          {draft.bookingMode === "same_pickup"
                            ? "↑ shared pickup"
                            : "↓ shared drop"}{" "}
                          ·
                        </span>
                      )}
                      {new Date(draft.savedAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setLoadedDraft({ ...draft })}
                      className="text-xs font-medium text-[#075E54] hover:text-[#168c41] transition"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="text-xs font-medium text-gray-400 hover:text-red-500 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
