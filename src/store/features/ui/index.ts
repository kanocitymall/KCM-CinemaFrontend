import { combineReducers } from "@reduxjs/toolkit";
import {
  navigationSliceActions,
  navigationSliceReducers,
} from "./navigation-slice";

export const uiReducer = combineReducers({
  navigation: navigationSliceReducers,
});

export const uiActions = {
  navigation: { ...navigationSliceActions },
};
