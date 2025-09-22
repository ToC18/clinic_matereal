import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Typography, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Switch, FormControlLabel
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/services/api.js';

const MaterialFormModal = ({ open, onClose, onSave, material }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (material) {
      setFormData(material);
    } else {
      setFormData({ name: '', unit: '', min_quantity: 0, is_narcotic: false, initial_quantity: 0 });
    }
  }, [material, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{material ? 'Редактировать материал' : 'Добавить новый материал'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField label="Название" name="name" value={formData.name || ''} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={6}><TextField label="Ед. изм." name="unit" value={formData.unit || ''} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={6}><TextField label="Мин. кол-во" name="min_quantity" type="number" value={formData.min_quantity || 0} onChange={handleChange} fullWidth /></Grid>
          {!material && (<Grid item xs={12}><TextField label="Начальное кол-во" name="initial_quantity" type="number" value={formData.initial_quantity || 0} onChange={handleChange} fullWidth /></Grid>)}
          <Grid item xs={12}><FormControlLabel control={<Switch name="is_narcotic" checked={formData.is_narcotic || false} onChange={handleChange} />} label="Наркотическое средство" /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/materials/', { params: { q: searchTerm } });
      setMaterials(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке материалов:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleOpenModal = (material = null) => {
    setEditingMaterial(material);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMaterial(null);
  };

  const handleSaveMaterial = async (formData) => {
    try {
      if (editingMaterial) {
        await api.put(`/materials/${editingMaterial.id}`, formData);
      } else {
        await api.post('/materials/', formData);
      }
      fetchMaterials();
    } catch (error) {
      console.error("Ошибка при сохранении материала:", error);
      alert('Произошла ошибка!');
    } finally {
      handleCloseModal();
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        await api.delete(`/materials/${id}`);
        fetchMaterials();
      } catch (error) {
        console.error("Ошибка при удалении материала:", error);
        alert('Произошла ошибка!');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Управление материалами</Typography>
        <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => handleOpenModal()}>Добавить материал</Button>
      </Box>
      <TextField fullWidth label="Поиск по названию..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 2 }}/>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Ед. изм.</TableCell>
                <TableCell align="right">Остаток</TableCell>
                <TableCell align="right">Мин. кол-во</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : (
                materials.map((material) => {
                  const isLowStock = material.total_quantity < material.min_quantity;
                  return (
                    <TableRow key={material.id} sx={{ backgroundColor: isLowStock ? 'rgba(255, 0, 0, 0.1)' : 'inherit' }}>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell align="right">{material.total_quantity}</TableCell>
                      <TableCell align="right">{material.min_quantity}</TableCell>
                      <TableCell>{material.is_narcotic ? 'Наркотическое' : 'Обычное'}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Редактировать"><IconButton onClick={() => handleOpenModal(material)}><EditIcon /></IconButton></Tooltip>
                        <Tooltip title="Удалить"><IconButton onClick={() => handleDeleteMaterial(material.id)}><DeleteIcon color="error" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <MaterialFormModal open={modalOpen} onClose={handleCloseModal} onSave={handleSaveMaterial} material={editingMaterial}/>
    </Box>
  );
};

export default MaterialsPage;