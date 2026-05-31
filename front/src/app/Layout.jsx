import { Outlet } from "react-router-dom";
import Header from "../shared/ui/Header";

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default Layout;