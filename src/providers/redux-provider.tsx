"use client";
import store from "@/store";
import { ReactNode } from "react";
import { Provider } from "react-redux";

const ReduxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
