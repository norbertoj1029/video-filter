// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn((listener) => {
        chrome.runtime.onMessage.listener = listener;  // Store the listener
      })
    }
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn()
    }
  },
  tabs: {
    onActivated: { addListener: jest.fn() },
    onRemoved: { addListener: jest.fn() },
    get: jest.fn(),
    sendMessage: jest.fn()
  },
  webNavigation: {
    onHistoryStateUpdated: { addListener: jest.fn() },
    onCompleted: { addListener: jest.fn() }
  }
};

// Mock window.location
delete window.location;
window.location = new URL('https://www.youtube.com');

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 