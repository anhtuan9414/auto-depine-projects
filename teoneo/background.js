let port;
let socket = null;
let pingInterval;
let countdownInterval;
let potentialPoints = 0;
let countdown = "Calculating...";
let pointsTotal = 0;
let pointsToday = 0;

chrome.runtime.onConnect.addListener(function (p) {
  port = p;
  port.onDisconnect.addListener(function () {
    port = null;
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CONNECT_WEBSOCKET") {
    connectWebSocket();
    sendResponse({ status: "WebSocket connection initiated" });
  } else if (message.type === "DISCONNECT_WEBSOCKET") {
    disconnectWebSocket();
    sendResponse({ status: "WebSocket disconnected" });
  } else if (message.type === "CHECK_WEBSOCKET_STATUS") {
    sendResponse({
      isConnected: socket !== null && socket.readyState === WebSocket.OPEN,
    });
  } else if (message.type === "FROM_REACT") {
    console.log("Received message from React:", message);
    sendResponse({ status: "Message received in background script" });
  } else if (message.type === "GET_COUNTDOWN_AND_POINTS") {
    sendResponse({ countdown, potentialPoints });
  } else if (message.type === "CLEAR_LOCAL_STORAGE") {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error clearing local storage:",
          chrome.runtime.lastError
        );
        sendResponse({
          status: "error",
          message: "Failed to clear local storage",
        });
      } else {
        console.log("Local storage cleared successfully");
        sendResponse({ status: "success", message: "Local storage cleared" });
      }
    });
    return true; // Indicates that the response is asynchronous
  } else if (message.type === "GET_LATEST_POINTS") {
    chrome.storage.local.get(["pointsTotal", "pointsToday"], (result) => {
      sendResponse({
        pointsTotal: result.pointsTotal || pointsTotal,
        pointsToday: result.pointsToday || pointsToday,
      });
    });
    return true; // Indicates that the response is asynchronous
  }
  return true;
});

function connectWebSocket() {
  if (socket) return;
  chrome.storage.local.get(["userId"], function (result) {
    const userId = result.userId;
    if (!userId) {
      if (port) {
        port.postMessage({ type: "USER_NOT_LOGGED_IN" });
      }
      return;
    }
    const version = "v0.2";
    const url = "wss://secure.ws.teneo.pro";
    const wsUrl = `${url}/websocket?userId=${encodeURIComponent(
      userId
    )}&version=${encodeURIComponent(version)}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = (event) => {
      // Set the initial lastUpdated time when the connection is established
      const connectionTime = new Date().toISOString();
      chrome.storage.local.set({ lastUpdated: connectionTime }, () => {
        if (port) {
          port.postMessage({
            type: "WEBSOCKET_CONNECTED",
            connectionTime: connectionTime,
          });
        }
        // Start pinging the server
        startPinging();
        // Start the countdown and points calculation
        startCountdownAndPoints();
      });
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (port) {
        port.postMessage({ type: "FROM_WEBSOCKET", data: data });
      } else {
        console.log("Port not available");
      }

      // Update lastUpdated and points when a new message is received
      if (data.pointsTotal !== undefined && data.pointsToday !== undefined) {
        const lastUpdated = new Date().toISOString();
        chrome.storage.local.set({
          lastUpdated: lastUpdated,
          pointsTotal: data.pointsTotal,
          pointsToday: data.pointsToday,
        });
        pointsTotal = data.pointsTotal;
        pointsToday = data.pointsToday;
      }
    };

    socket.onclose = (event) => {
      socket = null;
      chrome.storage.local.set({ isConnected: false });
      if (port) {
        port.postMessage({ type: "WEBSOCKET_DISCONNECTED" });
      }
      // Stop pinging when disconnected
      stopPinging();
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  });
}

function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
    // Stop pinging when manually disconnected
    stopPinging();
  }
}

function startPinging() {
  // Clear any existing interval
  stopPinging();
  // Set up a new interval to ping every 25 seconds
  pingInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
      // Store the last ping date
      chrome.storage.local.set({ lastPingDate: new Date().toISOString() });
    }
  }, 10000);
}

function stopPinging() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

function startCountdownAndPoints() {
  clearInterval(countdownInterval);
  updateCountdownAndPoints(); // Run once immediately
  countdownInterval = setInterval(updateCountdownAndPoints, 1000);
}

function updateCountdownAndPoints() {
  chrome.storage.local.get(["lastUpdated"], (result) => {
    const lastUpdated = result.lastUpdated;
    if (lastUpdated) {
      const nextHeartbeat = new Date(lastUpdated);
      nextHeartbeat.setMinutes(nextHeartbeat.getMinutes() + 15);

      const now = new Date();
      const diff = nextHeartbeat.getTime() - now.getTime();

      if (diff > 0) {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        countdown = `${minutes}m ${seconds}s`;

        const maxPoints = 25;
        const timeElapsed = now.getTime() - new Date(lastUpdated).getTime();
        const timeElapsedMinutes = timeElapsed / (60 * 1000);
        let newPoints = Math.min(
          maxPoints,
          (timeElapsedMinutes / 15) * maxPoints
        );
        newPoints = parseFloat(newPoints.toFixed(2));

        if (Math.random() < 0.1) {
          const bonus = Math.random() * 2;
          newPoints = Math.min(maxPoints, newPoints + bonus);
          newPoints = parseFloat(newPoints.toFixed(2));
        }

        potentialPoints = newPoints;
      } else {
        countdown = "Calculating...";
        potentialPoints = 25;
      }
    } else {
      countdown = "Calculating...";
      potentialPoints = 0;
    }

    chrome.storage.local.set({ potentialPoints, countdown });
  });
}

// Start the countdown when the background script loads
startCountdownAndPoints();
