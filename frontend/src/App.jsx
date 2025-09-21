import React from "react";
import MaterialsList from "./components/MaterialsList";

export default function App() {
  return (
    <div style={{padding:20, fontFamily: 'Arial'}}>
      <h1>Учёт материалов поликлиники</h1>
      <MaterialsList />
    </div>
  );
}
