import React, { useEffect, useState } from "react";
import axios from "axios";
import MaterialForm from "./MaterialForm";

const API = "http://localhost:8000";

export default function MaterialsList(){
  const [materials, setMaterials] = useState([]);

  const fetch = async () => {
    const res = await axios.get(`${API}/materials/`);
    setMaterials(res.data);
  };

  useEffect(()=>{ fetch(); },[]);

  return (
    <div>
      <MaterialForm onAdded={fetch} />
      <h2>Материалы</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th><th>Название</th><th>Ед.</th><th>Остаток</th><th>Мин.</th>
          </tr>
        </thead>
        <tbody>
          {materials.map(m => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.name}</td>
              <td>{m.unit}</td>
              <td>{m.quantity}</td>
              <td>{m.min_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
