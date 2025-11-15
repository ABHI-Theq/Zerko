import React, { useEffect, useState } from "react";

interface ReloadGuardProps {
  onBeforeReload: () => void;
}

const ReloadGuard: React.FC<ReloadGuardProps> = ({ onBeforeReload }) => {
  const [showModal, setShowModal] = useState(false);
  const [pendingReload, setPendingReload] = useState(false);

  const confirmReload = () => {
    onBeforeReload();
    window.location.reload();
  };

  // Intercept keyboard reload (F5, Ctrl+R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isReload =
        e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r");

      if (isReload) {
        e.preventDefault();
        setPendingReload(true);
        setShowModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Intercept browser reload button
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!pendingReload) {
        e.preventDefault();
        e.returnValue = "";
        setShowModal(true);
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingReload]);

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reload Page?
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Are you sure you want to reload this page?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmReload}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Yes, Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReloadGuard;
