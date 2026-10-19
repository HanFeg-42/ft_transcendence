import { useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import { useNotifications } from "../context/NotificationContext";

function formatTime(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleSelectTab = (tab: string) => {
    const routes: Record<string, string> = {
      HOME: "/home",
      PROFILE: "/profile",
      CHAT: "/chat",
      NOTIFICATION: "/notifications",
      SETTINGS: "/settings",
    };

    const path = routes[tab];

    if (path) {
      navigate(path);
    }
  };

  if (loading) {
    return (
      <Background>
        <Navbar
          activeTab="NOTIFICATION"
          onSelectTab={handleSelectTab}
        />

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-pixelify text-pacova-pink text-3xl uppercase">
              Loading...
            </p>
          </div>
        </main>
      </Background>
    );
  }

  if (error) {
    return (
      <Background>
        <Navbar
          activeTab="NOTIFICATION"
          onSelectTab={handleSelectTab}
        />

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-pacova-surface border-2 border-pacova-pink rounded-lg px-8 py-6">
            <p className="font-vt323 text-2xl text-pacova-pink">
              {error}
            </p>
          </div>
        </main>
      </Background>
    );
  }

  return (
    <Background>
      <Navbar
        activeTab="NOTIFICATION"
        onSelectTab={handleSelectTab}
      />

      <main className="flex-1 min-h-0 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] max-w-[1320px] mx-auto w-full px-4 py-5 overflow-hidden">
        <section className="h-full bg-pacova-surface border-2 border-pacova-green-dark rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <header className="px-6 py-5 border-b-2 border-pacova-green-dark flex items-center justify-between">
            <div>
              <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">
                Notifications
              </h1>

              <p className="font-vt323 text-xl text-gray-500 mt-1">
                Stay up to date with your Pacova activity
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="font-vt323 text-xl text-gray-400 hover:text-pacova-pink transition-colors cursor-pointer border border-gray-700 hover:border-pacova-pink rounded px-4 py-2"
              >
                Mark all as read
              </button>
            )}
          </header>

          {/* Notification list */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            {notifications.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="font-pixelify text-6xl text-pacova-green-dark mb-4">
                    ✓
                  </div>

                  <h2 className="font-pixelify text-2xl text-white uppercase">
                    All clear
                  </h2>

                  <p className="font-vt323 text-xl text-gray-500 mt-2">
                    You don't have any notifications yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {notifications.map((notification) => {
                  const isUnread = !notification.isRead;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        if (isUnread) {
                          markAsRead(notification.id);
                        }
                      }}
                      className={`
                        w-full text-left
                        rounded-lg
                        border-2
                        px-5 py-4
                        transition-all
                        cursor-pointer
                        ${
                          isUnread
                            ? "border-pacova-pink bg-pacova-pink/5 shadow-neon-pink"
                            : "border-gray-700 bg-black/10 hover:border-gray-600"
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                        {/* Notification indicator */}
                        <div
                          className={`
                            shrink-0
                            w-11 h-11
                            rounded-full
                            flex items-center justify-center
                            border-2
                            ${
                              isUnread
                                ? "border-pacova-pink text-pacova-pink"
                                : "border-gray-700 text-gray-600"
                            }
                          `}
                        >
                          <span className="font-pixelify text-lg">
                            {notification.type === "message" ? "✉" : "!"}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p
                                className={`font-vt323 text-2xl ${
                                  isUnread
                                    ? "text-white"
                                    : "text-gray-400"
                                }`}
                              >
                                {notification.type === "message"
                                  ? `New message from user ${notification.payload.senderId}`
                                  : "New notification"}
                              </p>

                              <p className="font-vt323 text-lg text-gray-500 mt-1">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>

                            {isUnread && (
                              <span className="shrink-0 mt-2 w-3 h-3 rounded-full bg-pacova-pink shadow-neon-pink" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </Background>
  );
}
