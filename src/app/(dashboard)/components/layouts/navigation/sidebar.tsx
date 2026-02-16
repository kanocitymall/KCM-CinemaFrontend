"use client";

import NavMenus from "./nav-menus";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { uiActions } from "@/store/features/ui";
import { MdClose, MdMenu } from "react-icons/md";
import { Offcanvas } from "react-bootstrap";

const Menus = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const handleClose = () => {
    dispatch(uiActions.navigation.setShowSideBar(false));
  };
  
  return (
    <div className="tw-h-full flex-column d-flex w-100">
      <div className="d-flex d-lg-none justify-content-between align-items-center p-3 border-bottom">
        <h5 className="mb-0">Menu</h5>
        <button 
          className="btn btn-link text-white p-0" 
          onClick={handleClose}
          aria-label="Close menu"
        >
          <MdClose size={24} />
        </button>
      </div>

      <div className="tw-mt-[20px] flex-grow-1 d-flex flex-column">
        <NavMenus />
      </div>
    </div>
  );
};

const SideBar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const ui = useSelector((state: RootState) => state.ui);

  const handleOpen = () => {
    dispatch(uiActions.navigation.setShowSideBar(true));
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="flex-column d-none d-lg-flex bg-dark text-white shadow position-fixed"
        style={{ width: "320px", top: 0, left: 0, zIndex: 1000, height: "100vh", overflowY: "auto" }}
      >
        <Menus />
      </aside>

      {/* Mobile Hamburger Button (only visible on small screens) */}
      <button 
        className="btn btn-dark d-lg-none position-fixed"
        onClick={handleOpen}
        style={{ top: "20px", left: "20px", zIndex: 999, borderRadius: "50%", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0" }}
        aria-label="Open menu"
      >
        <MdMenu size={24} color="white" />
      </button>
      
      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas 
        show={ui.navigation.showSideBar} 
        onHide={() => dispatch(uiActions.navigation.setShowSideBar(false))}
        className="bg-dark text-white"
        placement="start"
        style={{ width: "70%" }}
      >
        <Offcanvas.Body className="p-0">
          <Menus />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default SideBar;