import { Routes, Route, Link } from "react-router-dom";

export default function NotFound() {
  return (
    <>
      <h2>找不到路由</h2>
      <Link to="/">Home</Link>
    </>
  );
}