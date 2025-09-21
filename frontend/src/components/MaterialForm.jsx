import React, {useState} from "react";
import axios from "axios";
const API = "http://localhost:8000";

export default function MaterialForm({onAdded}){
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("шт");
  const [quantity, setQuantity] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/materials/`, {
      name, unit, quantity, min_quantity: 0
    });
    setName(""); setQuantity(0);
    if (onAdded) onAdded();
  };

  return (
    <form onSubmit={submit} style={{marginBottom: 20}}>
      <input required placeholder="Название" value={name} onChange={e=>setName(e.target.value)} />
      <input required placeholder="Ед." value={unit} onChange={e=>setUnit(e.target.value)} style={{marginLeft:10}} />
      <input type="number" placeholder="Кол-во" value={quantity} onChange={e=>setQuantity(parseFloat(e.target.value))} style={{marginLeft:10}}/>
      <button style={{marginLeft:10}} type="submit">Добавить</button>
    </form>
  );
}
