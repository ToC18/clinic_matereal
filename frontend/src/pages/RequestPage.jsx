import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Typography, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Grid, Chip, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '@/services/api.js';
import { AuthContext } from '@/contexts/AuthContext.jsx';
import { unitOptions, translateUnit } from '@/utils/translation.js';

const RequestPage = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [newItem, setNewItem] = useState({ material_name: '', quantity: '', unit: 'piece', expiration_date: '' });
  const [requestItems, setRequestItems] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests/');
      setRequests(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке заявок:", error);
    }
  };

  const handleAddItem = () => {
    if (newItem.material_name && newItem.quantity && newItem.unit) {
        const itemToAdd = {...newItem};
        if (!itemToAdd.expiration_date) {
            delete itemToAdd.expiration_date;
        }
        setRequestItems([...requestItems, itemToAdd]);
        setNewItem({ material_name: '', quantity: '', unit: 'piece', expiration_date: '' });
    }
  };

  const handleRemoveItem = (index) => {
    const updatedItems = requestItems.filter((_, i) => i !== index);
    setRequestItems(updatedItems);
  };

  const handleSubmitRequest = async () => {
    if (requestItems.length === 0) {
      alert('Добавьте хотя бы одну позицию в заявку.');
      return;
    }
    try {
      await api.post('/requests/', { items: requestItems });
      setRequestItems([]);
      fetchRequests();
    } catch (error) {
      console.error("Ошибка при отправке заявки:", error);
      alert('Не удалось отправить заявку.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/requests/${id}/approve`);
      fetchRequests();
    } catch (error) {
      console.error("Ошибка при подтверждении заявки:", error);
      alert('Не удалось подтвердить заявку.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Заявки на препараты</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Новая заявка</Typography>
        <Grid container spacing={2} alignItems="center" sx={{ my: 1 }}>
          <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Название" value={newItem.material_name} onChange={e => setNewItem({...newItem, material_name: e.target.value})} /></Grid>
          <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="number" label="Количество" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value) || ''})} /></Grid>
          <Grid item xs={6} sm={2}>
             <FormControl fullWidth size="small">
                <InputLabel id="unit-select-label-req">Ед. изм.</InputLabel>
                <Select
                    labelId="unit-select-label-req"
                    name="unit"
                    value={newItem.unit}
                    label="Ед. изм."
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                >
                    {unitOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Срок годности" type="date" value={newItem.expiration_date} onChange={e => setNewItem({...newItem, expiration_date: e.target.value})} InputLabelProps={{ shrink: true }}/></Grid>
          <Grid item xs={12} sm={2}><Button fullWidth variant="outlined" onClick={handleAddItem} startIcon={<AddIcon />}>Добавить</Button></Grid>
        </Grid>

        {requestItems.length > 0 && (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Название</TableCell><TableCell>Кол-во</TableCell><TableCell>Ед.</TableCell><TableCell>Срок годн.</TableCell><TableCell></TableCell></TableRow></TableHead>
                <TableBody>
                  {requestItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.material_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{translateUnit(item.unit)}</TableCell>
                      <TableCell>{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell align="right"><IconButton size="small" onClick={() => handleRemoveItem(index)}><DeleteIcon /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmitRequest}>Отправить заявку</Button>
          </>
        )}
      </Paper>

      <Typography variant="h6">История заявок</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Дата</TableCell><TableCell>Статус</TableCell><TableCell>Позиций</TableCell><TableCell>Действия</TableCell></TableRow></TableHead>
          <TableBody>
            {requests.map(req => (
              <TableRow key={req.id}>
                <TableCell>#{req.id}</TableCell>
                <TableCell>{new Date(req.created_at).toLocaleString()}</TableCell>
                <TableCell><Chip label={req.status} color={req.status === 'approved' ? 'success' : 'warning'} size="small" /></TableCell>
                <TableCell>{req.items.length}</TableCell>
                <TableCell>
                  {user?.role === 'admin' && req.status === 'pending' && (
                    <Tooltip title="Подтвердить поступление на склад">
                      <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleApprove(req.id)}>Подтвердить</Button>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RequestPage;