import { Routes, Route, Link } from "react-router-dom";
import NotFound from '../pages/NotFound';

import Template from "../pages/Template";
import Main from "../pages/Main";
import TodoSetting from "../pages/TodoSetting";
import EditDev from "../pages/EditDev";
import DevsList from "../pages/DevsList";
import CmdBuilder from "../pages/CmdBuilder";

export function MainRouter() {
  return <Routes>
    <Route path="" element={<Template />} >
      <Route index element={<Main />} />
      <Route path="/List" element={<DevsList/>} />
    </Route>
    <Route path="*" element={<NotFound />} />

  </Routes>
}