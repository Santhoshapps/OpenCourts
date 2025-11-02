// Lightweight in-memory fallback agent SDK
// Purpose: prevent unresolved import errors during build/deploy when a real
// external agent SDK is not available. This provides the minimal methods used
// by AdminChat.jsx and simulates simple conversation behavior.

const conversations = new Map(); // id -> conversation object
const subscribers = new Map(); // id -> Set of callbacks

function makeId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const agentSDK = {
  async listConversations({ agent_name } = {}) {
    // return all conversations (filter by agent_name if present)
    return Array.from(conversations.values()).filter((c) => {
      if (!agent_name) return true;
      return c.agent_name === agent_name;
    });
  },

  async createConversation({ agent_name, metadata } = {}) {
    const id = makeId();
    const conv = {
      id,
      agent_name: agent_name || null,
      metadata: metadata || {},
      messages: [],
      created_at: new Date().toISOString(),
    };
    conversations.set(id, conv);
    return conv;
  },

  async addMessage(conversationOrId, message) {
    const id = typeof conversationOrId === 'string' ? conversationOrId : conversationOrId?.id;
    if (!id) throw new Error('Invalid conversation id');
    const conv = conversations.get(id);
    if (!conv) {
      // If conv doesn't exist, create a minimal placeholder
      const placeholder = { id, messages: [], metadata: {} };
      conversations.set(id, placeholder);
    }
    const msg = Object.assign({ timestamp: new Date().toISOString() }, message);
    conversations.get(id).messages.push(msg);

    // notify subscribers
    const subs = subscribers.get(id);
    if (subs) {
      const payload = { messages: conversations.get(id).messages };
      subs.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          // swallow subscriber errors
          // eslint-disable-next-line no-console
          console.error('agentSDK subscriber error', e);
        }
      });
    }
    return msg;
  },

  subscribeToConversation(conversationId, cb) {
    if (!conversationId) throw new Error('conversationId required');
    if (!subscribers.has(conversationId)) subscribers.set(conversationId, new Set());
    subscribers.get(conversationId).add(cb);

    // immediately invoke callback with current messages (if any)
    const conv = conversations.get(conversationId);
    try {
      cb({ messages: conv?.messages || [] });
    } catch (e) {
      // ignore
    }

    // return unsubscribe function
    return () => {
      const set = subscribers.get(conversationId);
      if (set) {
        set.delete(cb);
        if (set.size === 0) subscribers.delete(conversationId);
      }
    };
  },
};

export default agentSDK;
