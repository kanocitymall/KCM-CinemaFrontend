import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  showSideBar: false,
};
const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setShowSideBar: (state, action) => {
      state.showSideBar = action.payload;
    },
  },
});

export const navigationSliceActions = navigationSlice.actions;
export const navigationSliceReducers = navigationSlice.reducer;
