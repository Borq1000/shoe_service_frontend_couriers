"use client";

import { SessionProvider } from "next-auth/react";
import NavBar from "./NavBar";

const NavBarSessionWrapper = () => (
  <SessionProvider>
    <NavBar />
  </SessionProvider>
);

export default NavBarSessionWrapper;
