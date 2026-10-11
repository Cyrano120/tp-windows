import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  activeChat: null,
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    sendMessage: (state, action) => {
      const { productId, from, to, text, productName } = action.payload;
      let conv = state.conversations.find(
        (c) => c.productId === productId && c.with === to
      );
      if (!conv) {
        conv = {
          id: Date.now().toString(),
          productId,
          productName,
          with: to,
          messages: [],
        };
        state.conversations.unshift(conv);
      }
      conv.messages.push({
        id: Date.now().toString(),
        from,
        text,
        date: new Date().toISOString(),
      });
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
  },
});

export const { sendMessage, setActiveChat } = messagesSlice.actions;
export default messagesSlice.reducer;
