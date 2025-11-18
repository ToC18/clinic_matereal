import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Typography, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import api from '@/services/api.js';
import { unitOptions, translateUnit } from '@/utils/translation.js';

const NarcoticLogModal = ({ open, onClose, onSave }) => {
    const [logData, setLogData] = useState({ patient_info: '', reason: '' });
    useEffect(() => { if (open) { setLogData({ patient_info: '', reason: '' }); } }, [open]);
    const handleChange = (e) => { const { name, value } = e.target; setLogData(prev => ({ ...prev, [name]: value })); };
    const handleSave = () => { if (logData.patient_info && logData.reason) { onSave(logData); } else { alert('Необходимо заполнить все поля.'); } };
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Журнал учета наркотических средств</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Для списания этого препарата необходимо заполнить данные.</Typography>
                <TextField autoFocus margin="dense" name="patient_info" label="Данные пациента (ФИО, № истории)" type="text" fullWidth variant="standard" value={logData.patient_info} onChange={handleChange} />
                <TextField margin="dense" name="reason" label="Причина назначения" type="text" fullWidth multiline rows={2} variant="standard" value={logData.reason} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={handleSave} variant="contained">Сохранить и списать</Button>
            </DialogActions>
        </Dialog>
    );
};

const DispenseModal = ({ open, onClose, material, onDispense }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedBatch, setSelectedBatch] = useState(null);
    useEffect(() => { if (open) { setQuantity(1); setSelectedBatch(null); } }, [open]);
    const handleDispense = () => {
        if (!selectedBatch) { alert('Необходимо выбрать партию для списания.'); return; }
        if (quantity <= 0 || quantity > selectedBatch.current_quantity) { alert('Указано некорректное количество.'); return; }
        onDispense(selectedBatch, quantity);
    };
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Списать: {material?.name}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 1 }}>Выберите партию:</Typography>
                <Box>
                    {material?.batches?.filter(b => b.current_quantity > 0).map(batch => (
                        <Button key={batch.id} variant={selectedBatch?.id === batch.id ? 'contained' : 'outlined'} onClick={() => setSelectedBatch(batch)} sx={{ mr: 1, mb: 1 }}>
                            Партия #{batch.id} (Остаток: {batch.current_quantity})
                        </Button>
                    ))}
                </Box>
                <TextField margin="normal" label="Количество для списания" type="number" fullWidth value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} InputProps={{ inputProps: { min: 1, max: selectedBatch?.current_quantity } }}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={handleDispense} variant="contained" color="primary">Далее</Button>
            </DialogActions>
        </Dialog>
    );
};

const MaterialFormModal = ({ open, onClose, onSave, material }) => {
  const [formData, setFormData] = useState({ unit: 'piece' });

  useEffect(() => {
    if (material) {
      setFormData(material);
    } else {
      setFormData({ name: '', unit: 'piece', min_quantity: 0, is_narcotic: false, initial_quantity: 0, expiration_date: '' });
    }
  }, [material, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const isNumeric = ['min_quantity', 'initial_quantity'].includes(name);
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (isNumeric ? parseFloat(value) : value) }));
  };

  const handleSubmit = () => {
    const dataToSend = { ...formData };
    if (!dataToSend.expiration_date) {
        delete dataToSend.expiration_date;
    }
    onSave(dataToSend);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{material ? 'Редактировать материал' : 'Добавить новый материал'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField label="Название" name="name" value={formData.name || ''} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
                <InputLabel id="unit-select-label">Ед. изм.</InputLabel>
                <Select
                    labelId="unit-select-label"
                    name="unit"
                    value={formData.unit || 'piece'}
                    label="Ед. изм."
                    onChange={handleChange}
                >
                    {unitOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}><TextField label="Мин. кол-во" name="min_quantity" type="number" value={formData.min_quantity || 0} onChange={handleChange} fullWidth /></Grid>
          {!material && (
            <>
              <Grid item xs={6}><TextField label="Начальное кол-во" name="initial_quantity" type="number" value={formData.initial_quantity || 0} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Срок годности" name="expiration_date" type="date" value={formData.expiration_date || ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }}/></Grid>
            </>
          )}
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
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispensingMaterial, setDispensingMaterial] = useState(null);
  const [narcoticLogModalOpen, setNarcoticLogModalOpen] = useState(false);
  const [narcoticLogData, setNarcoticLogData] = useState(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/materials/', { params: { q: searchTerm } });
      setMaterials(response.data);
    } catch (error) { console.error("Ошибка при загрузке материалов:", error); }
    finally { setLoading(false); }
  }, [searchTerm]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleOpenFormModal = (material = null) => { setEditingMaterial(material); setFormModalOpen(true); };
  const handleCloseFormModal = () => { setFormModalOpen(false); setEditingMaterial(null); };
  const handleOpenDispenseModal = (material) => { setDispensingMaterial(material); setDispenseModalOpen(true); };
  const handleCloseDispenseModal = () => { setDispenseModalOpen(false); setDispensingMaterial(null); };
  const handleCloseNarcoticLogModal = () => { setNarcoticLogModalOpen(false); setNarcoticLogData(null); };

  const handleSaveMaterial = async (formData) => {
    try {
      if (editingMaterial) { await api.put(`/materials/${editingMaterial.id}`, formData); }
      else { await api.post('/materials/', formData); }
      fetchMaterials();
    } catch (error) { console.error("Ошибка при сохранении:", error); alert('Произошла ошибка!'); }
    finally { handleCloseFormModal(); }
  };
  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Вы уверены?')) {
      try { await api.delete(`/materials/${id}`); fetchMaterials(); }
      catch (error) { console.error("Ошибка при удалении:", error); alert('Произошла ошибка!'); }
    }
  };
  const handleDispense = (batch, quantity) => {
      const transactionData = { batch_id: batch.id, material_id: dispensingMaterial.id, delta: -Math.abs(quantity) };
      if (dispensingMaterial.is_narcotic) { setNarcoticLogData(transactionData); setNarcoticLogModalOpen(true); }
      else { executeTransaction(transactionData); }
  };
  const handleSaveNarcoticLog = (logData) => {
      const fullTransactionData = { ...narcoticLogData, narcotic_log: logData };
      executeTransaction(fullTransactionData);
  };
  const executeTransaction = async (transactionData) => {
      try { await api.post('/transactions/', transactionData); fetchMaterials(); }
      catch (error) { console.error("Ошибка списания:", error); alert(error.response?.data?.detail || 'Ошибка списания!'); }
      finally { handleCloseDispenseModal(); handleCloseNarcoticLogModal(); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Управление материалами</Typography>
        <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => handleOpenFormModal()}>Добавить</Button>
      </Box>
      <TextField fullWidth label="Поиск по названию..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 2 }}/>
      <Paper sx={{ mb: 2 }}>
          <Grid container sx={{ p: 2, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}><Grid item xs={4}><Typography sx={{ fontWeight: 'bold' }}>Название</Typography></Grid><Grid item xs={2}><Typography sx={{ fontWeight: 'bold' }}>Ед.</Typography></Grid><Grid item xs={2} align="right"><Typography sx={{ fontWeight: 'bold' }}>Остаток</Typography></Grid><Grid item xs={4} align="right"><Typography sx={{ fontWeight: 'bold' }}>Действия</Typography></Grid></Grid>
      </Paper>
      {loading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box> )
      : ( materials.map((material) => (
          <Accordion key={material.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container alignItems="center">
                    <Grid item xs={4}><Typography>{material.name}</Typography></Grid>
                    <Grid item xs={2}><Typography color="text.secondary">{translateUnit(material.unit)}</Typography></Grid>
                    <Grid item xs={2} align="right"><Typography sx={{ color: material.total_quantity < material.min_quantity && material.min_quantity > 0 ? 'red' : 'inherit' }}>{material.total_quantity}</Typography></Grid>
                    <Grid item xs={4} align="right">
                      <Tooltip title="Списать"><IconButton onClick={(e) => { e.stopPropagation(); handleOpenDispenseModal(material); }}><RemoveCircleIcon color="warning"/></IconButton></Tooltip>
                      <Tooltip title="Редактировать"><IconButton onClick={(e) => { e.stopPropagation(); handleOpenFormModal(material); }}><EditIcon/></IconButton></Tooltip>
                      <Tooltip title="Удалить"><IconButton onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material.id); }}><DeleteIcon color="error"/></IconButton></Tooltip>
                    </Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Партии на складе:</Typography>
                {material.batches.filter(b => b.current_quantity > 0).length > 0 ? (
                    <TableContainer component={Paper} variant="outlined"><Table size="small">
                        <TableHead><TableRow><TableCell>ID Партии</TableCell><TableCell>Остаток</TableCell><TableCell>Срок годности</TableCell></TableRow></TableHead>
                        <TableBody>{material.batches.filter(b => b.current_quantity > 0).map(batch => (
                            <TableRow key={batch.id}><TableCell>#{batch.id}</TableCell><TableCell>{batch.current_quantity}</TableCell><TableCell>{batch.expiration_date ? new Date(batch.expiration_date).toLocaleDateString() : '—'}</TableCell></TableRow>
                        ))}</TableBody>
                    </Table></TableContainer>
                ) : <Typography>Нет партий на складе.</Typography>}
            </AccordionDetails>
          </Accordion>
      )))}
      <MaterialFormModal open={formModalOpen} onClose={handleCloseFormModal} onSave={handleSaveMaterial} material={editingMaterial}/>
      <DispenseModal open={dispenseModalOpen} onClose={handleCloseDispenseModal} material={dispensingMaterial} onDispense={handleDispense} />
      <NarcoticLogModal open={narcoticLogModalOpen} onClose={handleCloseNarcoticLogModal} onSave={handleSaveNarcoticLog} />
    </Box>
  );
};
export default MaterialsPage;