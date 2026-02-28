import { useState } from "react";
import { Toaster } from "react-hot-toast";
import BookingForm, { type DraftType } from "../components/BookingForm";
import MessagePreview from "../components/MessagePreview";
import { generateMessage, type MessageType } from "../messageTemplate";
import Footer from "./Footer";
import Header from "./Header";

const DRAFT_KEY = "tripmint_drafts";

const MainLayout = () => {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
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

  const filteredDrafts = drafts.filter((draft) =>
    draft.passengerName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <Toaster position="bottom-right" />

      <div className="max-w-6xl mx-auto w-full px-4 py-8 grid lg:grid-cols-2 gap-8">
        {/* LEFT FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <BookingForm
            key={loadedDraft?.id || "new"}
            onGenerate={handleGenerate}
            onSaveDraft={handleSaveDraft}
            initialDraft={loadedDraft}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <MessagePreview
              message={message}
              driverPhone=""
              passengerPhone=""
              onMessageUpdate={setMessage}
            />
          </div>

          {/* Drafts Below Preview */}
          {/* Draft Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold text-[#075E54] mb-4">Saved Drafts</h3>

            {/* Search Input */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search passenger..."
              className="w-full px-4 py-2 mb-4 border rounded-lg text-sm focus:ring-2 focus:ring-[#25D366]"
            />

            {filteredDrafts.length === 0 && (
              <p className="text-sm text-gray-400">No drafts found.</p>
            )}

            <div className="space-y-3">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border p-3 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {draft.passengerName || "Unnamed Ride"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(draft.savedAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => setLoadedDraft(draft)}
                      className="text-blue-600"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="text-red-500"
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
